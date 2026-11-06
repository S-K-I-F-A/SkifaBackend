import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UserEntity } from '../database/entities.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: UserEntity, @Query('category') category?: string) {
    return this.notifications.list(user.id, category);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: UserEntity) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }
}
