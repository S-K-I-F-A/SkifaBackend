import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlacementDto {
  @IsUUID()
  talentId: string;

  @IsString()
  @Length(2, 160)
  role: string;

  @IsDateString()
  startDate: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  monthlyStipend: number;
}

export class ReplacementDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class PlacementStatusDto {
  @IsIn([
    'accepted',
    'declined',
    'active',
    'ended',
    'cancelled',
    'replacement_requested',
  ])
  status:
    | 'accepted'
    | 'declined'
    | 'active'
    | 'ended'
    | 'cancelled'
    | 'replacement_requested';
}
