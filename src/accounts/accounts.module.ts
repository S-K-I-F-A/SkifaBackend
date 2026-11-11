import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CompanyProfileEntity,
  InternProfileEntity,
  PlacementEntity,
  UserEntity,
  WalletEntity,
} from '../database/entities.js';
import { AccountsController } from './accounts.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      InternProfileEntity,
      CompanyProfileEntity,
      WalletEntity,
      PlacementEntity,
    ]),
  ],
  controllers: [AccountsController],
})
export class AccountsModule {}
