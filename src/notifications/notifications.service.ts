import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { NotificationEntity } from '../database/entities.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
  ) {}

  async list(userId: string, category?: string) {
    const records = await this.notifications.find({
      where: category ? { userId, category } : { userId },
      order: { createdAt: 'DESC' },
    });
    return {
      items: records,
      unread: records.filter((record) => !record.readAt).length,
    };
  }

  async markRead(userId: string, id: string) {
    const record = await this.notifications.findOneBy({ id, userId });
    if (!record) throw new NotFoundException('Notification not found.');
    record.readAt = new Date();
    return this.notifications.save(record);
  }

  async unreadCount(userId: string) {
    return {
      count: await this.notifications.count({
        where: { userId, readAt: IsNull() },
      }),
    };
  }

  async setRead(userId: string, id: string, read: boolean) {
    const record = await this.notifications.findOneBy({ id, userId });
    if (!record) throw new NotFoundException('Notification not found.');
    record.readAt = read ? new Date() : null;
    return this.notifications.save(record);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notifications
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ readAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('readAt IS NULL')
      .execute();
    return { updated: result.affected || 0 };
  }
}
