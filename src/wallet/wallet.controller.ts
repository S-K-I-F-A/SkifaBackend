import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UserEntity } from '../database/entities.js';
import { AmountDto, SalaryPaymentDto } from './wallet.dto.js';
import { WalletService } from './wallet.service.js';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  get(@CurrentUser() user: UserEntity) {
    return this.wallet.get(user);
  }

  @Get('transactions')
  transactions(@CurrentUser() user: UserEntity, @Query('type') type?: string) {
    return this.wallet.listTransactions(user, type);
  }

  @Post('top-ups')
  topUp(@CurrentUser() user: UserEntity, @Body() dto: AmountDto) {
    return this.wallet.topUp(user, dto);
  }

  @Post('withdrawals')
  withdraw(@CurrentUser() user: UserEntity, @Body() dto: AmountDto) {
    return this.wallet.withdraw(user, dto);
  }

  @Get('withdrawals/:id')
  withdrawal(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.wallet.withdrawal(user, id);
  }

  @Post('salary-payments')
  salary(@CurrentUser() user: UserEntity, @Body() dto: SalaryPaymentDto) {
    return this.wallet.paySalary(user, dto);
  }
}

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('placements')
export class PlacementSalaryController {
  constructor(private readonly wallet: WalletService) {}

  @Post(':id/salary-payments')
  salary(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: AmountDto,
  ) {
    return this.wallet.payPlacementSalary(user, id, dto);
  }
}
