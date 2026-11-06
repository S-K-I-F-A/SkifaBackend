import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitialSchema1762074000000 } from './migrations/1762074000000-initial-schema.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            ssl: config.get<boolean>('DB_SSL', isProduction)
              ? { rejectUnauthorized: false }
              : false,
            autoLoadEntities: true,
            synchronize: config.get<boolean>('DB_SYNCHRONIZE', false),
            migrations: [InitialSchema1762074000000],
            migrationsRun: config.get<boolean>(
              'DB_MIGRATIONS_RUN',
              isProduction,
            ),
          };
        }

        const isTest = config.get<string>('NODE_ENV') === 'test';
        const location = resolve(
          config.get<string>('SQLITE_PATH', 'data/skifa.sqlite'),
        );
        if (!isTest) mkdirSync(dirname(location), { recursive: true });

        return {
          type: 'sqljs' as const,
          autoLoadEntities: true,
          location: isTest ? undefined : location,
          autoSave: !isTest,
          synchronize: true,
          dropSchema: isTest,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
