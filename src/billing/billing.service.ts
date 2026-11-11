import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CheckoutSessionEntity,
  NotificationEntity,
  UserEntity,
} from '../database/entities.js';
import type { CheckoutDto } from './billing.dto.js';

const AMOUNTS: Record<CheckoutDto['purpose'], number> = {
  profile_visibility: 100,
  company_activation: 1000,
  pro: 500,
};

@Injectable()
export class BillingService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(CheckoutSessionEntity)
    private readonly checkouts: Repository<CheckoutSessionEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
  ) {}

  entitlements(user: UserEntity) {
    return {
      pro: user.pro,
      walletActive: user.walletActive,
      profileVisible: user.profileVisible,
      companyActive: user.companyActive,
    };
  }

  async checkout(user: UserEntity, dto: CheckoutDto) {
    this.validatePurpose(user, dto.purpose);
    const returnUrl = this.validateReturnUrl(dto.returnUrl);
    const mode = this.config.get<string>('PAYMENTS_MODE', 'disabled');
    if (mode !== 'mock') {
      throw new ServiceUnavailableException(
        'A live payment provider has not been configured.',
      );
    }
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ServiceUnavailableException(
        'Mock checkout is disabled in production.',
      );
    }

    const session = await this.checkouts.save(
      this.checkouts.create({
        userId: user.id,
        purpose: dto.purpose,
        amountCents: AMOUNTS[dto.purpose],
        status: 'completed',
        returnUrl: returnUrl.href,
        providerReference: `mock_${Date.now()}`,
      }),
    );
    await this.grant(user, dto.purpose);
    returnUrl.searchParams.set('checkout', 'success');
    returnUrl.searchParams.set('sessionId', session.id);
    return { url: returnUrl.href, sessionId: session.id, mode: 'mock' };
  }

  private async grant(
    user: UserEntity,
    purpose: CheckoutDto['purpose'],
  ): Promise<void> {
    if (purpose === 'profile_visibility') user.profileVisible = true;
    if (purpose === 'company_activation') user.companyActive = true;
    if (purpose === 'pro') user.pro = true;
    await this.users.save(user);
    await this.notifications.save(
      this.notifications.create({
        userId: user.id,
        category: 'Payments',
        title: 'Checkout completed',
        description: `Your ${purpose.replaceAll('_', ' ')} entitlement is now active.`,
        icon: '$',
      }),
    );
  }

  private validatePurpose(
    user: UserEntity,
    purpose: CheckoutDto['purpose'],
  ): void {
    if (purpose === 'company_activation' && user.role !== 'company') {
      throw new ForbiddenException(
        'Only companies can activate company access.',
      );
    }
    if (purpose !== 'company_activation' && user.role !== 'intern') {
      throw new ForbiddenException(
        'This checkout is only available to interns.',
      );
    }
  }

  private validateReturnUrl(rawUrl: string): URL {
    const returnUrl = new URL(rawUrl);
    const frontendUrl = new URL(
      this.config.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    );
    if (returnUrl.origin !== frontendUrl.origin) {
      throw new BadRequestException('Return URL must use the frontend origin.');
    }
    return returnUrl;
  }
}
