import { IsIn, IsUrl } from 'class-validator';

export class CheckoutDto {
  @IsIn(['profile_visibility', 'company_activation', 'pro'])
  purpose: 'profile_visibility' | 'company_activation' | 'pro';

  @IsUrl({
    require_protocol: true,
    require_tld: false,
    protocols: ['http', 'https'],
  })
  returnUrl: string;
}
