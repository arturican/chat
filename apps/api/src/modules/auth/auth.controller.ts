import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

import { AccessTokenGuard } from './access-token.guard.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import type { CurrentUser as CurrentUserType } from './auth.types.js';

type AuthBody = {
  email: string;
  password: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: AuthBody, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.authService.register(body, reply);
  }

  @Post('login')
  login(@Body() body: AuthBody, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.authService.login(body, reply);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@CurrentUser() user: CurrentUserType) {
    return { user };
  }
}
