import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'intern' | 'company' | 'admin';
export type VerificationStatus =
  'not_started' | 'pending' | 'verified' | 'resubmit' | 'rejected';
export type PlacementStatus =
  'requested' | 'accepted' | 'active' | 'ended' | 'rejected';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20 })
  role: UserRole;

  @Column({ type: Date, nullable: true })
  emailConfirmedAt: Date | null;

  @Column({ type: String, nullable: true, select: false })
  emailConfirmationTokenHash: string | null;

  @Column({ type: String, nullable: true, select: false })
  passwordResetTokenHash: string | null;

  @Column({ type: Date, nullable: true, select: false })
  passwordResetExpiresAt: Date | null;

  @Column({ default: false })
  pro: boolean;

  @Column({ default: false })
  walletActive: boolean;

  @Column({ default: false })
  profileVisible: boolean;

  @Column({ default: false })
  companyActive: boolean;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface SkillValue {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Professional';
}

export interface EducationValue {
  school: string;
  course: string;
  years: string;
}

@Entity('intern_profiles')
export class InternProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  userId: string;

  @Column({ length: 120 })
  fullName: string;

  @Column({ default: '', length: 160 })
  headline: string;

  @Column({ default: '', length: 1000 })
  bio: string;

  @Column({ default: 'Nigeria', length: 80 })
  country: string;

  @Column({ default: '', length: 80 })
  state: string;

  @Column({ default: '', length: 80 })
  city: string;

  @Column({ default: '', length: 30 })
  phone: string;

  @Column({ default: '', length: 80 })
  category: string;

  @Column({ type: 'simple-json', default: '[]' })
  skills: SkillValue[];

  @Column({ default: '', length: 80 })
  experience: string;

  @Column({ default: '', length: 80 })
  availability: string;

  @Column({ default: 0 })
  stipendMin: number;

  @Column({ default: 0 })
  stipendMax: number;

  @Column({ type: 'simple-json', default: '[]' })
  education: EducationValue[];

  @Column({ type: 'simple-json', default: '[]' })
  certifications: string[];

  @Column({ type: 'simple-json', default: '[]' })
  workSamples: string[];

  @Column({ type: String, nullable: true })
  headshotPath: string | null;

  @Column({ type: String, nullable: true })
  fullBodyPhotoPath: string | null;

  @Column({ type: String, nullable: true })
  videoCvPath: string | null;

  @Column({ type: 'varchar', default: 'not_started', length: 30 })
  verificationStatus: VerificationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('company_profiles')
export class CompanyProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  userId: string;

  @Column({ length: 160 })
  name: string;

  @Column({ default: '', length: 100 })
  industry: string;

  @Column({ default: '', length: 60 })
  size: string;

  @Column({ default: 'Nigeria', length: 80 })
  country: string;

  @Column({ default: '', length: 80 })
  state: string;

  @Column({ default: '', length: 80 })
  city: string;

  @Column({ default: '', length: 240 })
  address: string;

  @Column({ default: '', length: 1000 })
  description: string;

  @Column({ default: '', length: 120 })
  contactName: string;

  @Column({ default: '', length: 120 })
  jobTitle: string;

  @Column({ default: '', length: 30 })
  phone: string;

  @Column({ default: '', length: 255 })
  contactEmail: string;

  @Column({ type: String, nullable: true })
  logoPath: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('wallets')
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  userId: string;

  @Column({ default: 'USD', length: 3 })
  currency: string;

  @Column({ default: 0 })
  balanceCents: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('wallet_transactions')
export class WalletTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  walletId: string;

  @Column({ type: 'varchar', length: 40 })
  type: 'top_up' | 'salary' | 'withdrawal' | 'fee' | 'adjustment';

  @Column()
  amountCents: number;

  @Column({ type: 'varchar', length: 20 })
  direction: 'credit' | 'debit';

  @Column({ type: 'varchar', default: 'pending', length: 30 })
  status: 'pending' | 'completed' | 'failed';

  @Column({ default: '', length: 255 })
  description: string;

  @Column({ type: String, nullable: true })
  reference: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('identity_verifications')
export class IdentityVerificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ select: false })
  ninHash: string;

  @Column({ length: 3 })
  ninLastThree: string;

  @Column()
  frontPath: string;

  @Column()
  backPath: string;

  @Column()
  selfiePath: string;

  @Column({ type: 'varchar', default: 'pending', length: 30 })
  status: VerificationStatus;

  @Column({ type: String, nullable: true, length: 500 })
  reviewNote: string | null;

  @Column({ type: Date, nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('checkout_sessions')
export class CheckoutSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'varchar', length: 40 })
  purpose: 'profile_visibility' | 'company_activation' | 'pro';

  @Column()
  amountCents: number;

  @Column({ default: 'USD', length: 3 })
  currency: string;

  @Column({ type: 'varchar', default: 'pending', length: 30 })
  status: 'pending' | 'completed' | 'failed';

  @Column({ length: 500 })
  returnUrl: string;

  @Column({ type: String, nullable: true })
  providerReference: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('placements')
export class PlacementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  companyUserId: string;

  @Index()
  @Column()
  internUserId: string;

  @Column({ length: 160 })
  role: string;

  @Column()
  startDate: string;

  @Column()
  monthlyStipendCents: number;

  @Column({ type: 'varchar', default: 'requested', length: 30 })
  status: PlacementStatus;

  @Column({ default: false })
  replacementRequested: boolean;

  @Column({ type: String, nullable: true, length: 500 })
  replacementReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ length: 80 })
  category: string;

  @Column({ length: 180 })
  title: string;

  @Column({ length: 500 })
  description: string;

  @Column({ default: '', length: 20 })
  icon: string;

  @Column({ type: Date, nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
