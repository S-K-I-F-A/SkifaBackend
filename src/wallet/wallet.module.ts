import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  InternProfileEntity,
  PlacementEntity,
  WalletEntity,
  WalletTransactionEntity,
} from '../database/entities.js';
import {
  PlacementSalaryController,
  WalletController,
} from './wallet.controller.js';
import { WalletService } from './wallet.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletEntity,
      WalletTransactionEntity,
      InternProfileEntity,
      PlacementEntity,
    ]),
  ],
  controllers: [WalletController, PlacementSalaryController],
  providers: [WalletService],
})
export class WalletModule {}
