import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SkillDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsIn(['Beginner', 'Intermediate', 'Professional'])
  level: 'Beginner' | 'Intermediate' | 'Professional';
}

export class EducationDto {
  @IsString()
  @MaxLength(160)
  school: string;

  @IsString()
  @MaxLength(160)
  course: string;

  @IsString()
  @MaxLength(40)
  years: string;
}

export class RegisterInternDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @Length(2, 120)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  experience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  availability?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  stipendMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  stipendMax?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUrl({ require_protocol: true }, { each: true })
  workSamples?: string[];
}

export class RegisterCompanyDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @Length(2, 160)
  name: string;

  @IsString()
  @MaxLength(100)
  industry: string;

  @IsString()
  @MaxLength(60)
  size: string;

  @IsString()
  @MaxLength(80)
  state: string;

  @IsString()
  @MaxLength(80)
  city: string;

  @IsString()
  @MaxLength(240)
  address: string;

  @IsString()
  @Length(20, 1000)
  description: string;

  @IsString()
  @MaxLength(120)
  contactName: string;

  @IsString()
  @MaxLength(120)
  jobTitle: string;

  @IsString()
  @MaxLength(30)
  phone: string;

  @IsEmail()
  @MaxLength(255)
  contactEmail: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(128)
  password: string;
}

export class EmailDto {
  @IsEmail()
  @MaxLength(255)
  email: string;
}

export class TokenDto {
  @IsString()
  @MinLength(20)
  token: string;
}

export class ResetPasswordDto extends TokenDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
