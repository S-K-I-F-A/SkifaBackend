import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { UserEntity } from '../database/entities.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@ApiTags('email')
@Controller('confirmation-email')
export class ConfirmationController {
  constructor(private readonly auth: AuthService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async send(@CurrentUser() user: UserEntity) {
    return { sent: await this.auth.requestConfirmation(user.email) };
  }
}
