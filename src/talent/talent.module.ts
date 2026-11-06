import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InternProfileEntity, UserEntity } from '../database/entities.js';
import { TalentController } from './talent.controller.js';
import { TalentService } from './talent.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InternProfileEntity, UserEntity])],
  controllers: [TalentController],
  providers: [TalentService],
  exports: [TalentService],
})
export class TalentModule {}
