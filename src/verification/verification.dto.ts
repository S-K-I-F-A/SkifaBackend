import {
  IsBooleanString,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class SubmitVerificationDto {
  @IsString()
  @Length(11, 11)
  nin: string;

  @IsBooleanString()
  consent: string;
}

export class ReviewVerificationDto {
  @IsIn(['verified', 'resubmit', 'rejected'])
  status: 'verified' | 'resubmit' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
