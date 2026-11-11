import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternProfileEntity, UserEntity } from '../database/entities.js';
import type { TalentQueryDto } from './talent.dto.js';

@Injectable()
export class TalentService {
  constructor(
    @InjectRepository(InternProfileEntity)
    private readonly profiles: Repository<InternProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async list(query: TalentQueryDto, viewer?: UserEntity) {
    const visibleUsers = await this.users.findBy({
      role: 'intern',
      profileVisible: true,
      active: true,
    });
    const userIds = new Set(visibleUsers.map((user) => user.id));
    let profiles = (await this.profiles.find()).filter((profile) =>
      userIds.has(profile.userId),
    );

    const search = query.query?.trim().toLowerCase();
    const skill = query.skill?.trim().toLowerCase();
    profiles = profiles.filter((profile) => {
      const searchable =
        `${profile.fullName} ${profile.headline} ${profile.skills.map((item) => item.name).join(' ')}`.toLowerCase();
      return (
        (!search || searchable.includes(search)) &&
        (!skill ||
          profile.skills.some((item) =>
            item.name.toLowerCase().includes(skill),
          )) &&
        (!query.state || profile.state === query.state) &&
        (!query.level ||
          profile.skills.some((item) => item.level === query.level)) &&
        (!query.experience || profile.experience === query.experience) &&
        (!query.availability || profile.availability === query.availability) &&
        (query.verification !== 'verified' ||
          profile.verificationStatus === 'verified') &&
        (query.maxStipend === undefined ||
          profile.stipendMin <= query.maxStipend)
      );
    });

    profiles.sort((a, b) => {
      if (query.sort === 'name') return a.fullName.localeCompare(b.fullName);
      if (query.sort === 'stipend') return a.stipendMin - b.stipendMin;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const total = profiles.length;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const canSeeDetails = viewer?.role === 'company' && viewer.companyActive;
    return {
      items: profiles
        .slice((page - 1) * pageSize, page * pageSize)
        .map((profile) => this.present(profile, canSeeDetails)),
      total,
      page,
      pageSize,
    };
  }

  async get(id: string, viewer?: UserEntity) {
    const profile = await this.profiles.findOneBy({ id });
    if (!profile) throw new NotFoundException('Talent profile not found.');
    const owner = await this.users.findOneBy({
      id: profile.userId,
      profileVisible: true,
      active: true,
    });
    if (!owner) throw new NotFoundException('Talent profile not found.');
    const canSeeDetails = viewer?.role === 'company' && viewer.companyActive;
    return this.present(profile, canSeeDetails);
  }

  private present(profile: InternProfileEntity, includePrivate: boolean) {
    const base = {
      id: profile.id,
      name: profile.fullName,
      headline: profile.headline,
      category: profile.category,
      skills: profile.skills,
      state: profile.state,
      city: profile.city,
      availability: profile.availability,
      experience: profile.experience,
      stipend: { min: profile.stipendMin, max: profile.stipendMax },
      idVerified: profile.verificationStatus === 'verified',
      hasVideoCv: Boolean(profile.videoCvPath),
      joined: profile.createdAt.toISOString().slice(0, 10),
      country: profile.country,
      initials: profile.fullName
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    };
    return includePrivate
      ? {
          ...base,
          bio: profile.bio,
          education: profile.education,
          certifications: profile.certifications,
          workSamples: profile.workSamples,
        }
      : {
          ...base,
          bio: null,
          education: [],
          certifications: [],
          workSamples: [],
        };
  }
}
