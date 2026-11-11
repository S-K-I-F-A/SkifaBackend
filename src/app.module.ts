import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BillingModule } from './billing/billing.module.js';
import { CommunicationsModule } from './communications/communications.module.js';
import { envValidationSchema } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { MediaModule } from './media/media.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PlacementsModule } from './placements/placements.module.js';
import { ProfilesModule } from './profiles/profiles.module.js';
import { StorageModule } from './storage/storage.module.js';
import { TalentModule } from './talent/talent.module.js';
import { VerificationModule } from './verification/verification.module.js';
import { WalletModule } from './wallet/wallet.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    AccountsModule,
    CommunicationsModule,
    StorageModule,
    AuthModule,
    ProfilesModule,
    BillingModule,
    TalentModule,
    VerificationModule,
    WalletModule,
    PlacementsModule,
    NotificationsModule,
    MediaModule,
    HealthModule,
  ],
})
export class AppModule {}
