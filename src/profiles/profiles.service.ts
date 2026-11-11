import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CompanyProfileEntity,
  InternProfileEntity,
  UserEntity,
} from '../database/entities.js';
import { StorageService } from '../storage/storage.service.js';
import type {
  UpdateCompanyProfileDto,
  UpdateInternProfileDto,
} from './profiles.dto.js';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(InternProfileEntity)
    private readonly interns: Repository<InternProfileEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly companies: Repository<CompanyProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly storage: StorageService,
  ) {}

  async getIntern(userId: string): Promise<InternProfileEntity> {
    const profile = await this.interns.findOneBy({ userId });
    if (!profile) throw new NotFoundException('Intern profile not found.');
    return profile;
  }

  async updateIntern(
    userId: string,
    dto: UpdateInternProfileDto,
  ): Promise<InternProfileEntity> {
    const profile = await this.getIntern(userId);
    Object.assign(profile, dto);
    return this.interns.save(profile);
  }

  async saveInternPhotos(
    user: UserEntity,
    files: {
      headshot?: Express.Multer.File[];
      fullBody?: Express.Multer.File[];
    },
  ): Promise<InternProfileEntity> {
    const profile = await this.getIntern(user.id);
    const headshot = files.headshot?.[0];
    const fullBody = files.fullBody?.[0];
    if (headshot) {
      profile.headshotPath = await this.storage.savePrivate(
        user.id,
        'headshot',
        headshot,
      );
    }
    if (fullBody) {
      profile.fullBodyPhotoPath = await this.storage.savePrivate(
        user.id,
        'full-body',
        fullBody,
      );
    }
    return this.interns.save(profile);
  }

  async getCompany(userId: string): Promise<CompanyProfileEntity> {
    const profile = await this.companies.findOneBy({ userId });
    if (!profile) throw new NotFoundException('Company profile not found.');
    return profile;
  }

  async updateCompany(
    userId: string,
    dto: UpdateCompanyProfileDto,
  ): Promise<CompanyProfileEntity> {
    const profile = await this.getCompany(userId);
    Object.assign(profile, dto);
    return this.companies.save(profile);
  }

  async saveCompanyLogo(
    user: UserEntity,
    file: Express.Multer.File,
  ): Promise<CompanyProfileEntity> {
    const profile = await this.getCompany(user.id);
    profile.logoPath = await this.storage.savePrivate(user.id, 'logo', file);
    return this.companies.save(profile);
  }

  async submitIntern(userId: string) {
    const profile = await this.getIntern(userId);
    const missing = [
      ['fullName', profile.fullName],
      ['headline', profile.headline],
      ['bio', profile.bio],
      ['state', profile.state],
      ['city', profile.city],
      ['phone', profile.phone],
      ['category', profile.category],
      ['skills', profile.skills.length > 0],
      ['experience', profile.experience],
      ['availability', profile.availability],
      ['headshot', profile.headshotPath],
    ].filter(([, value]) => !value);
    if (missing.length) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Complete the required profile fields.',
        fields: Object.fromEntries(
          missing.map(([field]) => [field, 'This field is required.']),
        ),
      });
    }
    return { submitted: true, profile };
  }

  async setVisibility(user: UserEntity, visibility: 'visible' | 'private') {
    if (visibility === 'visible' && !user.profileVisible) {
      throw new ForbiddenException({
        code: 'ENTITLEMENT_REQUIRED',
        message: 'Profile visibility entitlement is required.',
      });
    }
    user.profileVisible = visibility === 'visible';
    await this.users.save(user);
    return { visibility };
  }

  async submitCompany(userId: string) {
    const company = await this.getCompany(userId);
    const required = [
      company.name,
      company.industry,
      company.size,
      company.state,
      company.city,
      company.description,
      company.contactName,
      company.jobTitle,
      company.phone,
      company.contactEmail,
    ];
    if (required.some((value) => !value)) {
      throw new UnprocessableEntityException(
        'Complete all required company fields.',
      );
    }
    return { submitted: true, status: 'payment_pending', company };
  }
}
