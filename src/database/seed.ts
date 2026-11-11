import { loadEnvFile } from 'node:process';
import { hash } from 'bcryptjs';
import { DataSource, type EntityManager } from 'typeorm';
import {
  CheckoutSessionEntity,
  CompanyProfileEntity,
  IdentityVerificationEntity,
  InternProfileEntity,
  NotificationEntity,
  PlacementEntity,
  UserEntity,
  WalletEntity,
  WalletTransactionEntity,
} from './entities.js';
import { InitialSchema1762074000000 } from './migrations/1762074000000-initial-schema.js';

try {
  loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

const entities = [
  UserEntity,
  InternProfileEntity,
  CompanyProfileEntity,
  WalletEntity,
  WalletTransactionEntity,
  IdentityVerificationEntity,
  CheckoutSessionEntity,
  NotificationEntity,
  PlacementEntity,
];

const useLocalDatabase = process.argv.includes('--local');

function createDataSource(): DataSource {
  if (process.env.DATABASE_URL && !useLocalDatabase) {
    return new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl:
        process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      entities,
      migrations: [InitialSchema1762074000000],
      migrationsTableName: 'typeorm_migrations',
    });
  }

  return new DataSource({
    type: 'sqljs',
    location: process.env.SQLITE_PATH || 'data/skifa.sqlite',
    autoSave: true,
    synchronize: true,
    entities,
  });
}

async function saveUser(
  manager: EntityManager,
  passwordHash: string,
  values: Pick<UserEntity, 'email' | 'role'> & Partial<UserEntity>,
): Promise<UserEntity> {
  const repository = manager.getRepository(UserEntity);
  const email = values.email.toLowerCase();
  const existing = await repository.findOneBy({ email });
  const user = existing ?? repository.create();
  repository.merge(user, values, {
    email,
    passwordHash,
    emailConfirmedAt: existing?.emailConfirmedAt ?? new Date(),
    active: true,
  });
  return repository.save(user);
}

async function seed(): Promise<void> {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_PRODUCTION_SEED !== 'true'
  ) {
    throw new Error(
      'Production seeding is disabled. Set ALLOW_PRODUCTION_SEED=true to confirm.',
    );
  }

  const password = process.env.SEED_PASSWORD || 'SkifaDemo123!';
  if (password.length < 12) {
    throw new Error('SEED_PASSWORD must contain at least 12 characters.');
  }

  const dataSource = createDataSource();
  try {
    await dataSource.initialize();
  } catch (error) {
    const connectionError = error as NodeJS.ErrnoException;
    if (
      process.env.DATABASE_URL &&
      !useLocalDatabase &&
      ['ECONNREFUSED', 'EACCES'].includes(connectionError.code ?? '')
    ) {
      throw new Error(
        'PostgreSQL is not reachable at DATABASE_URL. Start PostgreSQL, or run `pnpm db:seed:local` to seed the local SQL.js database.',
        { cause: error },
      );
    }
    throw error;
  }

  try {
    if (process.env.DATABASE_URL && !useLocalDatabase) {
      await dataSource.runMigrations();
    }
    const passwordHash = await hash(password, 12);

    await dataSource.transaction(async (manager) => {
      const admin = await saveUser(manager, passwordHash, {
        email: 'admin@skifa.local',
        role: 'admin',
      });
      const company = await saveUser(manager, passwordHash, {
        email: 'company@skifa.local',
        role: 'company',
        walletActive: true,
        companyActive: true,
      });
      const ada = await saveUser(manager, passwordHash, {
        email: 'ada@skifa.local',
        role: 'intern',
        pro: true,
        walletActive: true,
        profileVisible: true,
      });
      const tunde = await saveUser(manager, passwordHash, {
        email: 'tunde@skifa.local',
        role: 'intern',
        walletActive: true,
        profileVisible: true,
      });

      const companyProfiles = manager.getRepository(CompanyProfileEntity);
      const companyProfile =
        (await companyProfiles.findOneBy({ userId: company.id })) ??
        companyProfiles.create();
      companyProfiles.merge(companyProfile, {
        userId: company.id,
        name: 'Northstar Labs',
        industry: 'Technology',
        size: '11-50',
        state: 'Lagos',
        city: 'Yaba',
        address: '12 Herbert Macaulay Way',
        description: 'A product studio building useful software for Africa.',
        contactName: 'Amaka Okafor',
        jobTitle: 'People Operations Lead',
        phone: '+2348000000001',
        contactEmail: 'company@skifa.local',
      });
      await companyProfiles.save(companyProfile);

      const internProfiles = manager.getRepository(InternProfileEntity);
      const profiles = [
        {
          userId: ada.id,
          fullName: 'Ada Nwosu',
          headline: 'Frontend Developer',
          bio: 'Frontend developer focused on accessible, responsive products.',
          state: 'Lagos',
          city: 'Ikeja',
          phone: '+2348000000002',
          category: 'Software Development',
          skills: [
            { name: 'TypeScript', level: 'Professional' as const },
            { name: 'React', level: 'Professional' as const },
          ],
          experience: '1-2 years',
          availability: 'Immediately',
          stipendMin: 150_000,
          stipendMax: 250_000,
          education: [
            {
              school: 'University of Lagos',
              course: 'Computer Science',
              years: '2021-2025',
            },
          ],
          verificationStatus: 'verified' as const,
        },
        {
          userId: tunde.id,
          fullName: 'Tunde Bello',
          headline: 'Product Designer',
          bio: 'Product designer turning complex workflows into clear experiences.',
          state: 'Oyo',
          city: 'Ibadan',
          phone: '+2348000000003',
          category: 'Design',
          skills: [
            { name: 'Figma', level: 'Professional' as const },
            { name: 'User Research', level: 'Intermediate' as const },
          ],
          experience: 'Less than 1 year',
          availability: 'Within 2 weeks',
          stipendMin: 100_000,
          stipendMax: 180_000,
          education: [
            {
              school: 'University of Ibadan',
              course: 'Communication Arts',
              years: '2020-2024',
            },
          ],
          verificationStatus: 'pending' as const,
        },
      ];

      for (const profile of profiles) {
        const internProfile =
          (await internProfiles.findOneBy({ userId: profile.userId })) ??
          internProfiles.create();
        internProfiles.merge(internProfile, profile);
        await internProfiles.save(internProfile);
      }

      const wallets = manager.getRepository(WalletEntity);
      for (const user of [company, ada, tunde]) {
        const existing = await wallets.findOneBy({ userId: user.id });
        const wallet = existing ?? wallets.create();
        wallets.merge(wallet, {
          userId: user.id,
          currency: 'NGN',
          balanceCents: existing?.balanceCents ?? 0,
        });
        await wallets.save(wallet);
      }

      const placements = manager.getRepository(PlacementEntity);
      const existingPlacement = await placements.findOneBy({
        companyUserId: company.id,
        internUserId: ada.id,
      });
      const placement = existingPlacement ?? placements.create();
      placements.merge(placement, {
        companyUserId: company.id,
        internUserId: ada.id,
        role: 'Frontend Developer Intern',
        startDate: '2026-11-16',
        monthlyStipendCents: 200_000_00,
        status: 'active',
      });
      await placements.save(placement);

      const notifications = manager.getRepository(NotificationEntity);
      if (!(await notifications.existsBy({ userId: admin.id }))) {
        await notifications.save(
          notifications.create({
            userId: admin.id,
            category: 'System',
            title: 'Seed data is ready',
            description:
              'The reusable Skifa demo dataset was loaded successfully.',
            icon: '✓',
          }),
        );
      }
    });

    console.log('Database seeded successfully.');
    console.log(
      'Accounts: admin@skifa.local, company@skifa.local, ada@skifa.local, tunde@skifa.local',
    );
    console.log(
      process.env.SEED_PASSWORD
        ? 'Password: the value configured in SEED_PASSWORD'
        : 'Password: SkifaDemo123!',
    );
  } finally {
    await dataSource.destroy();
  }
}

await seed();
