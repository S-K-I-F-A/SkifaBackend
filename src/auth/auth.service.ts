import { createHash, randomBytes } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { EmailService } from '../communications/email.service.js';
import {
  CompanyProfileEntity,
  InternProfileEntity,
  NotificationEntity,
  UserEntity,
  WalletEntity,
} from '../database/entities.js';
import type {
  LoginDto,
  RegisterCompanyDto,
  RegisterInternDto,
} from './auth.dto.js';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;
    const existing = await this.users.findOneBy({ email });
    if (existing) return;
    await this.users.save(
      this.users.create({
        email,
        passwordHash: await hash(password, 12),
        role: 'admin',
        emailConfirmedAt: new Date(),
        walletActive: false,
      }),
    );
  }

  async registerIntern(dto: RegisterInternDto) {
    const emailAddress = dto.email.trim().toLowerCase();
    await this.ensureEmailAvailable(emailAddress);
    const confirmationToken = this.createToken();

    const user = await this.dataSource.transaction(async (manager) => {
      const createdUser = await manager.save(
        manager.create(UserEntity, {
          email: emailAddress,
          passwordHash: await hash(dto.password, 12),
          role: 'intern',
          emailConfirmationTokenHash: this.hashToken(confirmationToken),
        }),
      );
      await manager.save(
        manager.create(InternProfileEntity, {
          userId: createdUser.id,
          fullName: dto.fullName.trim(),
          headline: dto.headline?.trim() || '',
          bio: dto.bio?.trim() || '',
          state: dto.state?.trim() || '',
          city: dto.city?.trim() || '',
          phone: dto.phone?.trim() || '',
          category: dto.category?.trim() || '',
          skills: dto.skills || [],
          experience: dto.experience?.trim() || '',
          availability: dto.availability?.trim() || '',
          stipendMin: dto.stipendMin || 0,
          stipendMax: dto.stipendMax || 0,
          education: dto.education || [],
          certifications: dto.certifications || [],
          workSamples: dto.workSamples || [],
        }),
      );
      await manager.save(
        manager.create(WalletEntity, { userId: createdUser.id }),
      );
      await manager.save(
        manager.create(NotificationEntity, {
          userId: createdUser.id,
          category: 'Reminders',
          title: 'Complete your Skifa profile',
          description:
            'Verify your identity and make your profile visible when you are ready.',
          icon: '!',
        }),
      );
      return createdUser;
    });

    await this.email.sendConfirmation(user.email, confirmationToken);
    return this.session(user);
  }

  async registerCompany(dto: RegisterCompanyDto) {
    const emailAddress = dto.email.trim().toLowerCase();
    await this.ensureEmailAvailable(emailAddress);
    const confirmationToken = this.createToken();

    const user = await this.dataSource.transaction(async (manager) => {
      const createdUser = await manager.save(
        manager.create(UserEntity, {
          email: emailAddress,
          passwordHash: await hash(dto.password, 12),
          role: 'company',
          walletActive: true,
          emailConfirmationTokenHash: this.hashToken(confirmationToken),
        }),
      );
      await manager.save(
        manager.create(CompanyProfileEntity, {
          userId: createdUser.id,
          name: dto.name.trim(),
          industry: dto.industry.trim(),
          size: dto.size.trim(),
          state: dto.state.trim(),
          city: dto.city.trim(),
          address: dto.address.trim(),
          description: dto.description.trim(),
          contactName: dto.contactName.trim(),
          jobTitle: dto.jobTitle.trim(),
          phone: dto.phone.trim(),
          contactEmail: dto.contactEmail.trim().toLowerCase(),
        }),
      );
      await manager.save(
        manager.create(WalletEntity, { userId: createdUser.id }),
      );
      return createdUser;
    });

    await this.email.sendConfirmation(user.email, confirmationToken);
    return this.session(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email: dto.email.trim() })
      .getOne();
    if (
      !user ||
      !user.active ||
      !(await compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return this.session(user);
  }

  async requestConfirmation(emailAddress: string): Promise<boolean> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.emailConfirmationTokenHash')
      .where('LOWER(user.email) = LOWER(:email)', {
        email: emailAddress.trim(),
      })
      .getOne();
    if (!user || user.emailConfirmedAt) return true;
    const token = this.createToken();
    user.emailConfirmationTokenHash = this.hashToken(token);
    await this.users.save(user);
    return this.email.sendConfirmation(user.email, token);
  }

  async confirmEmail(token: string): Promise<void> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.emailConfirmationTokenHash')
      .where('user.emailConfirmationTokenHash = :token', {
        token: this.hashToken(token),
      })
      .getOne();
    if (!user)
      throw new UnauthorizedException('Confirmation token is invalid.');
    user.emailConfirmedAt = new Date();
    user.emailConfirmationTokenHash = null;
    await this.users.save(user);
  }

  async requestPasswordReset(emailAddress: string): Promise<void> {
    const user = await this.users.findOneBy({
      email: emailAddress.trim().toLowerCase(),
    });
    if (!user) return;
    const token = this.createToken();
    user.passwordResetTokenHash = this.hashToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.users.save(user);
    await this.email.sendPasswordReset(user.email, token);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordResetTokenHash')
      .addSelect('user.passwordResetExpiresAt')
      .where('user.passwordResetTokenHash = :token', {
        token: this.hashToken(token),
      })
      .getOne();
    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Reset token is invalid or expired.');
    }
    user.passwordHash = await hash(password, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await this.users.save(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user || !(await compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    user.passwordHash = await hash(newPassword, 12);
    await this.users.save(user);
  }

  session(user: UserEntity) {
    return {
      accessToken: this.jwt.sign({ sub: user.id, role: user.role }),
      user: this.publicUser(user),
      entitlements: this.entitlements(user),
    };
  }

  publicUser(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailConfirmed: Boolean(user.emailConfirmedAt),
      createdAt: user.createdAt,
    };
  }

  entitlements(user: UserEntity) {
    return {
      pro: user.pro,
      walletActive: user.walletActive,
      profileVisible: user.profileVisible,
      companyActive: user.companyActive,
    };
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    if (await this.users.existsBy({ email })) {
      throw new ConflictException('An account already exists for this email.');
    }
  }

  private createToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
