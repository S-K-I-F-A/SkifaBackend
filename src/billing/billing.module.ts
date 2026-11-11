import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CheckoutSessionEntity,
  NotificationEntity,
  UserEntity,
} from '../database/entities.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CheckoutSessionEntity,
      NotificationEntity,
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
