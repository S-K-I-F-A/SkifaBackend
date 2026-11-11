import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InternProfileEntity,
  NotificationEntity,
  PlacementEntity,
  UserEntity,
} from '../database/entities.js';
import type {
  CreatePlacementDto,
  PlacementStatusDto,
  ReplacementDto,
} from './placements.dto.js';

@Injectable()
export class PlacementsService {
  constructor(
    @InjectRepository(PlacementEntity)
    private readonly placements: Repository<PlacementEntity>,
    @InjectRepository(InternProfileEntity)
    private readonly interns: Repository<InternProfileEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
  ) {}

  async create(company: UserEntity, dto: CreatePlacementDto) {
    if (!company.companyActive) {
      throw new ForbiddenException('Activate the company account first.');
    }
    const intern = await this.interns.findOneBy({ id: dto.talentId });
    if (!intern) throw new NotFoundException('Talent profile not found.');
    const placement = await this.placements.save(
      this.placements.create({
        companyUserId: company.id,
        internUserId: intern.userId,
        role: dto.role.trim(),
        startDate: dto.startDate,
        monthlyStipendCents: dto.monthlyStipend * 100,
      }),
    );
    await this.notifications.save(
      this.notifications.create({
        userId: intern.userId,
        category: 'Opportunities & offers',
        title: 'New placement request',
        description: `A company requested you for the ${placement.role} role.`,
        icon: '◇',
      }),
    );
    return placement;
  }

  list(user: UserEntity) {
    return this.placements.find({
      where:
        user.role === 'company'
          ? { companyUserId: user.id }
          : { internUserId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  async requestReplacement(
    company: UserEntity,
    id: string,
    dto: ReplacementDto,
  ) {
    const placement = await this.ownedByCompany(company.id, id);
    placement.replacementRequested = true;
    placement.replacementReason = dto.reason?.trim() || null;
    return this.placements.save(placement);
  }

  async updateStatus(user: UserEntity, id: string, dto: PlacementStatusDto) {
    const placement = await this.placements.findOneBy({ id });
    if (!placement) throw new NotFoundException('Placement not found.');
    const ownsPlacement =
      placement.companyUserId === user.id || placement.internUserId === user.id;
    if (!ownsPlacement && user.role !== 'admin') throw new ForbiddenException();
    if (
      user.role === 'intern' &&
      !['accepted', 'rejected'].includes(dto.status)
    ) {
      throw new ForbiddenException(
        'Interns can only accept or reject requests.',
      );
    }
    placement.status = dto.status;
    return this.placements.save(placement);
  }

  private async ownedByCompany(companyUserId: string, id: string) {
    const placement = await this.placements.findOneBy({ id, companyUserId });
    if (!placement) throw new NotFoundException('Placement not found.');
    return placement;
  }
}
