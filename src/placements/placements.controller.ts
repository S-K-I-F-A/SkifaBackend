import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { UserEntity } from '../database/entities.js';
import {
  CreatePlacementDto,
  PlacementStatusDto,
  ReplacementDto,
} from './placements.dto.js';
import { PlacementsService } from './placements.service.js';

@ApiTags('placements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('placements')
export class PlacementsController {
  constructor(private readonly placements: PlacementsService) {}

  @Post()
  @Roles('company')
  create(@CurrentUser() user: UserEntity, @Body() dto: CreatePlacementDto) {
    return this.placements.create(user, dto);
  }

  @Get()
  @Roles('intern', 'company', 'admin')
  list(@CurrentUser() user: UserEntity) {
    return this.placements.list(user);
  }

  @Post(':id/replacement')
  @Roles('company')
  replacement(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: ReplacementDto,
  ) {
    return this.placements.requestReplacement(user, id, dto);
  }

  @Patch(':id/status')
  @Roles('intern', 'company', 'admin')
  updateStatus(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: PlacementStatusDto,
  ) {
    return this.placements.updateStatus(user, id, dto);
  }
}
