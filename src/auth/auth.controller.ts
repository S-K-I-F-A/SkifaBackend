import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { UserEntity } from '../database/entities.js';
import {
  EmailDto,
  LoginDto,
  RegisterCompanyDto,
  RegisterInternDto,
  ResetPasswordDto,
  TokenDto,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register/intern')
  async registerIntern(
    @Body() dto: RegisterInternDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.registerIntern(dto);
    this.setSessionCookie(response, session.accessToken);
    return session;
  }

  @Post('register/company')
  async registerCompany(
    @Body() dto: RegisterCompanyDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.registerCompany(dto);
    this.setSessionCookie(response, session.accessToken);
    return session;
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.login(dto);
    this.setSessionCookie(response, session.accessToken);
    return session;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie('skifa_session', this.cookieOptions());
  }

  @Post('forgot-password')
  @HttpCode(202)
  async forgotPassword(@Body() dto: EmailDto) {
    await this.auth.requestPasswordReset(dto.email);
    return { accepted: true };
  }

  @Post('reset-password')
  @HttpCode(204)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.password);
  }

  @Post('confirm-email')
  @HttpCode(204)
  async confirmEmail(@Body() dto: TokenDto): Promise<void> {
    await this.auth.confirmEmail(dto.token);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: UserEntity) {
    return {
      user: this.auth.publicUser(user),
      entitlements: this.auth.entitlements(user),
    };
  }

  private setSessionCookie(response: Response, token: string): void {
    response.cookie('skifa_session', token, {
      ...this.cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private cookieOptions() {
    const sameSite = this.config.get<'lax' | 'strict' | 'none'>(
      'COOKIE_SAME_SITE',
      'lax',
    );
    return {
      httpOnly: true,
      secure: this.config.get<boolean>('COOKIE_SECURE', false),
      sameSite,
      path: '/',
    } as const;
  }
}
