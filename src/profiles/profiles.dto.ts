import { OmitType, PartialType } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { RegisterCompanyDto, RegisterInternDto } from '../auth/auth.dto.js';

export class UpdateInternProfileDto extends PartialType(
  OmitType(RegisterInternDto, ['email', 'password'] as const),
) {}

export class UpdateCompanyProfileDto extends PartialType(
  OmitType(RegisterCompanyDto, ['email', 'password'] as const),
) {}

export class ProfileVisibilityDto {
  @IsIn(['visible', 'private'])
  visibility: 'visible' | 'private';
}
