import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  IdentityVerificationEntity,
  InternProfileEntity,
  NotificationEntity,
  UserEntity,
} from '../database/entities.js';
import { VerificationController } from './verification.controller.js';
import { VerificationService } from './verification.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IdentityVerificationEntity,
      InternProfileEntity,
      UserEntity,
      NotificationEntity,
    ]),
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
