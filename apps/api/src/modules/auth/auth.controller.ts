import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { AuthResponse, MeResponse, RefreshResponse } from '@pulsechat/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/app-config.constants';
import { AccessTokenGuard } from './access-token.guard';
import {
  createRefreshCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
} from './auth.constants';
import { CurrentUser } from './current-user.decorator';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { AuthService } from './auth.service';
import type { AccessTokenPayload, RequestContext } from './auth.types';

// Nest uses DTO classes at runtime for reflected validation metadata.
const authDtoRuntimeReferences = [LoginRequestDto, RegisterRequestDto];
void authDtoRuntimeReferences;

@Controller()
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Post('auth/register')
  async register(
    @Body() input: RegisterRequestDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(input, this.extractRequestContext(request));

    this.setRefreshCookie(reply, result.refreshToken);

    return result.response;
  }

  @HttpCode(200)
  @Post('auth/login')
  async login(
    @Body() input: LoginRequestDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(input, this.extractRequestContext(request));

    this.setRefreshCookie(reply, result.refreshToken);

    return result.response;
  }

  @HttpCode(200)
  @Post('auth/refresh')
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<RefreshResponse> {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME];
    const result = await this.authService.refresh(refreshToken);

    this.setRefreshCookie(reply, result.refreshToken);

    return result.response;
  }

  @HttpCode(204)
  @Post('auth/logout')
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.authService.logout(request.cookies[REFRESH_TOKEN_COOKIE_NAME]);

    reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      ...createRefreshCookieOptions(this.config),
      path: REFRESH_TOKEN_COOKIE_PATH,
    });
    reply.status(204).send();
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  async getMe(@CurrentUser() user: AccessTokenPayload): Promise<MeResponse> {
    return this.authService.getMe(user.sub);
  }

  private setRefreshCookie(reply: FastifyReply, refreshToken: string) {
    reply.setCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      ...createRefreshCookieOptions(this.config),
      expires: new Date(Date.now() + this.config.refreshTokenTtlMs),
      path: REFRESH_TOKEN_COOKIE_PATH,
    });
  }

  private extractRequestContext(request: FastifyRequest): RequestContext {
    const userAgentHeader = request.headers['user-agent'];

    return {
      userAgent: typeof userAgentHeader === 'string' ? userAgentHeader : null,
      ipAddress: request.ip ?? null,
    };
  }
}
