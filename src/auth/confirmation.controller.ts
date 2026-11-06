import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmailDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';

@ApiTags('email')
@Controller('confirmation-email')
export class ConfirmationController {
  constructor(private readonly auth: AuthService) {}

  @Post()
  @HttpCode(200)
  async send(@Body() dto: EmailDto) {
    return { sent: await this.auth.requestConfirmation(dto.email) };
  }
}
