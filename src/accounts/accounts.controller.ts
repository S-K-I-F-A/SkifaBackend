import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import {
  CompanyProfileEntity,
  InternProfileEntity,
  PlacementEntity,
  UserEntity,
  WalletEntity,
} from '../database/entities.js';

@ApiTags('account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AccountsController {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(InternProfileEntity)
    private readonly interns: Repository<InternProfileEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly companies: Repository<CompanyProfileEntity>,
    @InjectRepository(WalletEntity)
    private readonly wallets: Repository<WalletEntity>,
    @InjectRepository(PlacementEntity)
    private readonly placements: Repository<PlacementEntity>,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: UserEntity) {
    const profile =
      user.role === 'intern'
        ? await this.interns.findOneBy({ userId: user.id })
        : user.role === 'company'
          ? await this.companies.findOneBy({ userId: user.id })
          : null;
    return {
      user: this.publicUser(user),
      profile,
      onboarding: { complete: this.profileComplete(user, profile) },
    };
  }

  @Delete('me')
  async close(@CurrentUser() user: UserEntity) {
    user.active = false;
    user.profileVisible = false;
    user.companyActive = false;
    await this.users.save(user);
    return { closed: true };
  }

  @Get('intern/dashboard')
  async internDashboard(@CurrentUser() user: UserEntity) {
    if (user.role !== 'intern') throw new ForbiddenException();
    const profile = await this.interns.findOneByOrFail({ userId: user.id });
    const wallet = await this.wallets.findOneBy({ userId: user.id });
    const placement = await this.placements.findOne({
      where: { internUserId: user.id, status: 'active' },
      order: { updatedAt: 'DESC' },
    });
    return {
      profile,
      profileCompletion: this.internCompletion(profile),
      visibility: user.profileVisible ? 'visible' : 'private',
      verification: profile.verificationStatus,
      walletActive: user.walletActive,
      pro: user.pro,
      hasVideoCv: Boolean(profile.videoCvPath),
      wallet,
      activePlacement: placement,
      nextAction: this.nextInternAction(user, profile),
    };
  }

  @Get('company/dashboard')
  async companyDashboard(@CurrentUser() user: UserEntity) {
    if (user.role !== 'company' || !user.companyActive) {
      throw new ForbiddenException('Activate the company account first.');
    }
    const wallet = await this.wallets.findOneBy({ userId: user.id });
    const placements = await this.placements.find({
      where: { companyUserId: user.id },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    const active = placements.filter((item) => item.status === 'active');
    return {
      wallet,
      activePlacementCount: active.length,
      monthlyPayrollMinor: active.reduce(
        (sum, item) => sum + item.monthlyStipendCents,
        0,
      ),
      placements,
    };
  }

  private publicUser(user: UserEntity) {
    return {
      id: user.id,
      role: user.role,
      email: user.email,
      emailVerified: Boolean(user.emailConfirmedAt),
      status: user.active ? 'active' : 'closed',
      createdAt: user.createdAt,
    };
  }

  private profileComplete(
    user: UserEntity,
    profile: InternProfileEntity | CompanyProfileEntity | null,
  ): boolean {
    if (!profile) return user.role === 'admin';
    if (profile instanceof InternProfileEntity)
      return this.internCompletion(profile) === 100;
    return Boolean(
      profile.name &&
      profile.industry &&
      profile.city &&
      profile.description &&
      profile.contactName &&
      profile.contactEmail,
    );
  }

  private internCompletion(profile: InternProfileEntity): number {
    const checks = [
      profile.fullName,
      profile.headline,
      profile.bio,
      profile.state,
      profile.city,
      profile.phone,
      profile.category,
      profile.skills.length > 0,
      profile.experience,
      profile.availability,
      profile.headshotPath,
      profile.education.length > 0,
    ];
    return Math.round(
      (checks.filter((value) => Boolean(value)).length / checks.length) * 100,
    );
  }

  private nextInternAction(user: UserEntity, profile: InternProfileEntity) {
    if (this.internCompletion(profile) < 100) return 'complete_profile';
    if (!user.profileVisible) return 'activate_visibility';
    if (profile.verificationStatus !== 'verified') return 'verify_identity';
    return 'browse_opportunities';
  }
}
