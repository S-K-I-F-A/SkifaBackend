import { createHmac } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IdentityVerificationEntity,
  InternProfileEntity,
  NotificationEntity,
  UserEntity,
} from '../database/entities.js';
import { StorageService } from '../storage/storage.service.js';
import type {
  ReviewVerificationDto,
  SubmitVerificationDto,
} from './verification.dto.js';

interface VerificationFiles {
  front?: Express.Multer.File[];
  back?: Express.Multer.File[];
  selfie?: Express.Multer.File[];
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly config: ConfigService,
    private readonly storage: StorageService,
    @InjectRepository(IdentityVerificationEntity)
    private readonly verifications: Repository<IdentityVerificationEntity>,
    @InjectRepository(InternProfileEntity)
    private readonly profiles: Repository<InternProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
  ) {}

  async submit(
    user: UserEntity,
    dto: SubmitVerificationDto,
    files: VerificationFiles,
    resubmissionId?: string,
  ) {
    if (resubmissionId) {
      const previous = await this.verifications.findOneBy({
        id: resubmissionId,
        userId: user.id,
      });
      if (!previous) throw new NotFoundException('Verification not found.');
      if (!['resubmit', 'rejected'].includes(previous.status)) {
        throw new ConflictException('This verification cannot be resubmitted.');
      }
    }
    if (dto.consent !== 'true') {
      throw new BadRequestException('Document ownership consent is required.');
    }
    const front = files.front?.[0];
    const back = files.back?.[0];
    const selfie = files.selfie?.[0];
    if (!front || !back || !selfie) {
      throw new BadRequestException(
        'Front, back and selfie files are required.',
      );
    }

    const record = await this.verifications.save(
      this.verifications.create({
        userId: user.id,
        ninHash: this.hashNin(dto.nin),
        ninLastThree: dto.nin.slice(-3),
        frontPath: await this.storage.savePrivate(user.id, 'nin-front', front),
        backPath: await this.storage.savePrivate(user.id, 'nin-back', back),
        selfiePath: await this.storage.savePrivate(user.id, 'selfie', selfie),
        status: 'pending',
      }),
    );
    await this.profiles.update(
      { userId: user.id },
      { verificationStatus: 'pending' },
    );
    return this.present(record);
  }

  async latest(userId: string) {
    const record = await this.verifications.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return record
      ? this.present(record)
      : { status: 'not_started', ninLastThree: null };
  }

  async listPending() {
    const records = await this.verifications.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
    return records.map((record) => this.present(record));
  }

  async review(id: string, dto: ReviewVerificationDto) {
    const record = await this.verifications.findOneBy({ id });
    if (!record) throw new NotFoundException('Verification not found.');
    record.status = dto.status;
    record.reviewNote = dto.note?.trim() || null;
    record.reviewedAt = new Date();
    await this.verifications.save(record);
    await this.profiles.update(
      { userId: record.userId },
      { verificationStatus: dto.status },
    );
    if (dto.status === 'verified') {
      await this.users.update({ id: record.userId }, { walletActive: true });
    }
    await this.notifications.save(
      this.notifications.create({
        userId: record.userId,
        category: 'Reminders',
        title: 'Identity verification updated',
        description:
          dto.status === 'verified'
            ? 'Your identity is verified and your wallet is active.'
            : dto.note || `Your verification status is now ${dto.status}.`,
        icon: dto.status === 'verified' ? '✓' : '!',
      }),
    );
    return this.present(record);
  }

  private present(record: IdentityVerificationEntity) {
    return {
      id: record.id,
      status: record.status,
      ninLastThree: record.ninLastThree,
      reviewNote: record.reviewNote,
      submittedAt: record.createdAt,
      reviewedAt: record.reviewedAt,
    };
  }

  private hashNin(nin: string): string {
    return createHmac(
      'sha256',
      this.config.getOrThrow<string>('NIN_HASH_SECRET'),
    )
      .update(nin)
      .digest('hex');
  }
}
