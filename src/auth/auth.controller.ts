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
  ChangePasswordDto,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard, OptionalJwtAuthGuard } from './jwt-auth.guard.js';

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

  @Post(['forgot-password', 'password/forgot'])
  @HttpCode(202)
  async forgotPassword(@Body() dto: EmailDto) {
    await this.auth.requestPasswordReset(dto.email);
    return { accepted: true };
  }

  @Post(['reset-password', 'password/reset'])
  @HttpCode(204)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.password);
  }

  @Post(['confirm-email', 'email/verify'])
  @HttpCode(204)
  async confirmEmail(@Body() dto: TokenDto): Promise<void> {
    await this.auth.confirmEmail(dto.token);
  }

  @Get('session')
  @UseGuards(OptionalJwtAuthGuard)
  session(@CurrentUser() user?: UserEntity) {
    return { user: user ? this.auth.publicUser(user) : null };
  }

  @Post('email/resend')
  @UseGuards(JwtAuthGuard)
  async resend(@CurrentUser() user: UserEntity) {
    return { sent: await this.auth.requestConfirmation(user.email) };
  }

  @Post('password/change')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: UserEntity,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
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
