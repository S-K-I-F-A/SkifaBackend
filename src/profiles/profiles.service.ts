import { Injectable, NotFoundException } from '@nestjs/common';
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
}
