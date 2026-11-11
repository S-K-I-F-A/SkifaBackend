import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InternProfileEntity } from '../database/entities.js';
import { MediaController } from './media.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([InternProfileEntity])],
  controllers: [MediaController],
})
export class MediaModule {}
