import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1762074000000 implements MigrationInterface {
  name = 'InitialSchema1762074000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL UNIQUE,
        "passwordHash" varchar NOT NULL,
        "role" varchar(20) NOT NULL,
        "emailConfirmedAt" timestamptz,
        "emailConfirmationTokenHash" varchar,
        "passwordResetTokenHash" varchar,
        "passwordResetExpiresAt" timestamptz,
        "pro" boolean NOT NULL DEFAULT false,
        "walletActive" boolean NOT NULL DEFAULT false,
        "profileVisible" boolean NOT NULL DEFAULT false,
        "companyActive" boolean NOT NULL DEFAULT false,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "intern_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL UNIQUE,
        "fullName" varchar(120) NOT NULL,
        "headline" varchar(160) NOT NULL DEFAULT '',
        "bio" varchar(1000) NOT NULL DEFAULT '',
        "country" varchar(80) NOT NULL DEFAULT 'Nigeria',
        "state" varchar(80) NOT NULL DEFAULT '',
        "city" varchar(80) NOT NULL DEFAULT '',
        "phone" varchar(30) NOT NULL DEFAULT '',
        "category" varchar(80) NOT NULL DEFAULT '',
        "skills" text NOT NULL DEFAULT '[]',
        "experience" varchar(80) NOT NULL DEFAULT '',
        "availability" varchar(80) NOT NULL DEFAULT '',
        "stipendMin" integer NOT NULL DEFAULT 0,
        "stipendMax" integer NOT NULL DEFAULT 0,
        "education" text NOT NULL DEFAULT '[]',
        "certifications" text NOT NULL DEFAULT '[]',
        "workSamples" text NOT NULL DEFAULT '[]',
        "headshotPath" varchar,
        "fullBodyPhotoPath" varchar,
        "videoCvPath" varchar,
        "verificationStatus" varchar(30) NOT NULL DEFAULT 'not_started',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_intern_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "company_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL UNIQUE,
        "name" varchar(160) NOT NULL,
        "industry" varchar(100) NOT NULL DEFAULT '',
        "size" varchar(60) NOT NULL DEFAULT '',
        "country" varchar(80) NOT NULL DEFAULT 'Nigeria',
        "state" varchar(80) NOT NULL DEFAULT '',
        "city" varchar(80) NOT NULL DEFAULT '',
        "address" varchar(240) NOT NULL DEFAULT '',
        "description" varchar(1000) NOT NULL DEFAULT '',
        "contactName" varchar(120) NOT NULL DEFAULT '',
        "jobTitle" varchar(120) NOT NULL DEFAULT '',
        "phone" varchar(30) NOT NULL DEFAULT '',
        "contactEmail" varchar(255) NOT NULL DEFAULT '',
        "logoPath" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_company_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL UNIQUE,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "balanceCents" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_wallet_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wallet_transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "walletId" uuid NOT NULL,
        "type" varchar(40) NOT NULL,
        "amountCents" integer NOT NULL,
        "direction" varchar(20) NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'pending',
        "description" varchar(255) NOT NULL DEFAULT '',
        "reference" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_transaction_wallet" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_transaction_wallet" ON "wallet_transactions" ("walletId")',
    );
    await queryRunner.query(`
      CREATE TABLE "identity_verifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "ninHash" varchar NOT NULL,
        "ninLastThree" varchar(3) NOT NULL,
        "frontPath" varchar NOT NULL,
        "backPath" varchar NOT NULL,
        "selfiePath" varchar NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'pending',
        "reviewNote" varchar(500),
        "reviewedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_verification_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_verification_user" ON "identity_verifications" ("userId")',
    );
    await queryRunner.query(`
      CREATE TABLE "checkout_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "purpose" varchar(40) NOT NULL,
        "amountCents" integer NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "status" varchar(30) NOT NULL DEFAULT 'pending',
        "returnUrl" varchar(500) NOT NULL,
        "providerReference" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_checkout_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_checkout_user" ON "checkout_sessions" ("userId")',
    );
    await queryRunner.query(`
      CREATE TABLE "placements" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyUserId" uuid NOT NULL,
        "internUserId" uuid NOT NULL,
        "role" varchar(160) NOT NULL,
        "startDate" varchar NOT NULL,
        "monthlyStipendCents" integer NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'requested',
        "replacementRequested" boolean NOT NULL DEFAULT false,
        "replacementReason" varchar(500),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_placement_company" FOREIGN KEY ("companyUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_placement_intern" FOREIGN KEY ("internUserId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_placement_company" ON "placements" ("companyUserId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_placement_intern" ON "placements" ("internUserId")',
    );
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "category" varchar(80) NOT NULL,
        "title" varchar(180) NOT NULL,
        "description" varchar(500) NOT NULL,
        "icon" varchar(20) NOT NULL DEFAULT '',
        "readAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notification_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_notification_user" ON "notifications" ("userId")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'notifications',
      'placements',
      'checkout_sessions',
      'identity_verifications',
      'wallet_transactions',
      'wallets',
      'company_profiles',
      'intern_profiles',
      'users',
    ]) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
  }
}
