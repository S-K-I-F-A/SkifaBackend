import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  InternProfileEntity,
  UserEntity,
  WalletEntity,
  WalletTransactionEntity,
} from '../database/entities.js';
import type { AmountDto, SalaryPaymentDto } from './wallet.dto.js';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(WalletEntity)
    private readonly wallets: Repository<WalletEntity>,
    @InjectRepository(WalletTransactionEntity)
    private readonly transactions: Repository<WalletTransactionEntity>,
    @InjectRepository(InternProfileEntity)
    private readonly interns: Repository<InternProfileEntity>,
  ) {}

  async get(user: UserEntity) {
    const wallet = await this.wallet(user.id);
    return {
      id: wallet.id,
      active: user.walletActive,
      currency: wallet.currency,
      balanceCents: wallet.balanceCents,
      balance: wallet.balanceCents / 100,
    };
  }

  async listTransactions(user: UserEntity, type?: string) {
    const wallet = await this.wallet(user.id);
    return this.transactions.find({
      where: type
        ? { walletId: wallet.id, type: type as WalletTransactionEntity['type'] }
        : { walletId: wallet.id },
      order: { createdAt: 'DESC' },
    });
  }

  async topUp(user: UserEntity, dto: AmountDto) {
    if (user.role !== 'company') {
      throw new ForbiddenException('Only company wallets can be topped up.');
    }
    if (
      this.config.get<string>('PAYMENTS_MODE', 'disabled') !== 'mock' ||
      this.config.get<string>('NODE_ENV') === 'production'
    ) {
      throw new ServiceUnavailableException(
        'Live wallet funding has not been configured.',
      );
    }
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOneByOrFail(WalletEntity, {
        userId: user.id,
      });
      wallet.balanceCents += dto.amount * 100;
      await manager.save(wallet);
      return manager.save(
        manager.create(WalletTransactionEntity, {
          walletId: wallet.id,
          type: 'top_up',
          direction: 'credit',
          amountCents: dto.amount * 100,
          status: 'completed',
          description: 'Development wallet top-up',
          reference: `mock_topup_${Date.now()}`,
        }),
      );
    });
  }

  async withdraw(user: UserEntity, dto: AmountDto) {
    if (user.role !== 'intern' || !user.walletActive) {
      throw new ForbiddenException('Activate the intern wallet first.');
    }
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOneByOrFail(WalletEntity, {
        userId: user.id,
      });
      const amountCents = dto.amount * 100;
      if (wallet.balanceCents < amountCents) {
        throw new BadRequestException('Insufficient wallet balance.');
      }
      wallet.balanceCents -= amountCents;
      await manager.save(wallet);
      return manager.save(
        manager.create(WalletTransactionEntity, {
          walletId: wallet.id,
          type: 'withdrawal',
          direction: 'debit',
          amountCents,
          status: 'pending',
          description: 'Withdrawal request',
        }),
      );
    });
  }

  async paySalary(user: UserEntity, dto: SalaryPaymentDto) {
    if (user.role !== 'company' || !user.companyActive) {
      throw new ForbiddenException('Activate the company account first.');
    }
    const intern = await this.interns.findOneBy({ id: dto.talentId });
    if (!intern) throw new NotFoundException('Talent profile not found.');
    return this.dataSource.transaction(async (manager) => {
      const companyWallet = await manager.findOneByOrFail(WalletEntity, {
        userId: user.id,
      });
      const internWallet = await manager.findOneByOrFail(WalletEntity, {
        userId: intern.userId,
      });
      const amountCents = dto.amount * 100;
      if (companyWallet.balanceCents < amountCents) {
        throw new BadRequestException('Insufficient company wallet balance.');
      }
      companyWallet.balanceCents -= amountCents;
      internWallet.balanceCents += amountCents;
      await manager.save([companyWallet, internWallet]);
      const reference = `salary_${Date.now()}`;
      const debit = manager.create(WalletTransactionEntity, {
        walletId: companyWallet.id,
        type: 'salary',
        direction: 'debit',
        amountCents,
        status: 'completed',
        description: `Salary payment to ${intern.fullName}`,
        reference,
      });
      const credit = manager.create(WalletTransactionEntity, {
        walletId: internWallet.id,
        type: 'salary',
        direction: 'credit',
        amountCents,
        status: 'completed',
        description: 'Placement salary payment',
        reference,
      });
      await manager.save([debit, credit]);
      return debit;
    });
  }

  private async wallet(userId: string): Promise<WalletEntity> {
    const wallet = await this.wallets.findOneBy({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found.');
    return wallet;
  }
}
