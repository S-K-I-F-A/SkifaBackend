import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UserEntity } from '../database/entities.js';
import { CheckoutDto } from './billing.dto.js';
import { BillingService } from './billing.service.js';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('entitlements')
  entitlements(@CurrentUser() user: UserEntity) {
    return this.billing.entitlements(user);
  }

  @Post('checkout')
  checkout(@CurrentUser() user: UserEntity, @Body() dto: CheckoutDto) {
    return this.billing.checkout(user, dto);
  }

  @Get('billing/products')
  products() {
    return this.billing.products();
  }

  @Get('payments/:id')
  payment(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.billing.payment(user, id);
  }
}
