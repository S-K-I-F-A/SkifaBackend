import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { TalentQueryDto } from './talent.dto.js';
import { TalentService } from './talent.service.js';

@ApiTags('talent')
@Controller('talent')
@UseGuards(OptionalJwtAuthGuard)
export class TalentController {
  constructor(private readonly talent: TalentService) {}

  @Get()
  list(@Query() query: TalentQueryDto, @Req() request: AuthenticatedRequest) {
    return this.talent.list(query, request.user);
  }

  @Get('filters')
  filters() {
    return this.talent.filters();
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.talent.get(id, request.user);
  }
}
