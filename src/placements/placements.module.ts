import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  InternProfileEntity,
  NotificationEntity,
  PlacementEntity,
} from '../database/entities.js';
import { PlacementsController } from './placements.controller.js';
import { PlacementsService } from './placements.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlacementEntity,
      InternProfileEntity,
      NotificationEntity,
    ]),
  ],
  controllers: [PlacementsController],
  providers: [PlacementsService],
})
export class PlacementsModule {}
