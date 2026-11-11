import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CompanyProfileEntity,
  InternProfileEntity,
  UserEntity,
} from '../database/entities.js';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InternProfileEntity,
      CompanyProfileEntity,
      UserEntity,
    ]),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
