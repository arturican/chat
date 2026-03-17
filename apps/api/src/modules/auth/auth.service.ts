import { Inject, Injectable } from '@nestjs/common';
import type {
  AuthResponse,
  LoginRequest,
  MeResponse,
  RefreshResponse,
  RegisterRequest,
} from '@pulsechat/contracts';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { AppException } from '../../common/exceptions/app-exception';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/app-config.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicUser } from './auth.mapper';
import { createSessionId, hashPassword, hashToken, verifyPassword } from './auth.security';
import type { RefreshTokenPayload, RequestContext } from './auth.types';

interface RegisterResult {
  response: AuthResponse;
  refreshToken: string;
}

interface LoginResult {
  response: AuthResponse;
  refreshToken: string;
}

interface RefreshResult {
  response: RefreshResponse;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async register(input: RegisterRequest, context: RequestContext): Promise<RegisterResult> {
    const email = this.normalizeEmail(input.email);
    const username = this.normalizeUsername(input.username);
    const passwordHash = await hashPassword(input.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          profile: {
            create: {
              username,
            },
          },
        },
        include: {
          profile: true,
        },
      });
      const session = await this.issueSession(user.id, context);

      return {
        response: {
          user: toPublicUser(user),
          accessToken: await this.signAccessToken(user.id, session.sessionId),
        },
        refreshToken: session.refreshToken,
      };
    } catch (error) {
      return this.handleKnownPrismaError(error);
    }
  }

  async login(input: LoginRequest, context: RequestContext): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: this.normalizeEmail(input.email),
      },
      include: {
        profile: true,
      },
    });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new AppException({
        status: 401,
        code: 'invalid_credentials',
        message: 'Email or password is incorrect.',
      });
    }

    const session = await this.issueSession(user.id, context);

    return {
      response: {
        user: toPublicUser(user),
        accessToken: await this.signAccessToken(user.id, session.sessionId),
      },
      refreshToken: session.refreshToken,
    };
  }

  async refresh(refreshToken: string | undefined): Promise<RefreshResult> {
    if (!refreshToken) {
      throw this.invalidRefreshToken();
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: {
        id: payload.sessionId,
      },
    });

    if (!session || session.userId !== payload.sub) {
      throw this.invalidRefreshToken();
    }

    if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw this.invalidRefreshToken();
    }

    if (session.refreshTokenHash !== hashToken(refreshToken)) {
      throw this.invalidRefreshToken();
    }

    const nextRefreshToken = await this.signRefreshToken(session.userId, session.id);
    const nextExpiresAt = new Date(Date.now() + this.config.refreshTokenTtlMs);

    await this.prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        refreshTokenHash: hashToken(nextRefreshToken),
        expiresAt: nextExpiresAt,
      },
    });

    return {
      response: {
        accessToken: await this.signAccessToken(session.userId, session.id),
      },
      refreshToken: nextRefreshToken,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);

      await this.prisma.session.updateMany({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      return;
    }
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new AppException({
        status: 401,
        code: 'unauthorized',
        message: 'User account is not available.',
      });
    }

    return {
      user: toPublicUser(user),
    };
  }

  private async issueSession(userId: string, context: RequestContext) {
    const sessionId = createSessionId();
    const refreshToken = await this.signRefreshToken(userId, sessionId);
    const expiresAt = new Date(Date.now() + this.config.refreshTokenTtlMs);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash: hashToken(refreshToken),
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt,
      },
    });

    return {
      sessionId,
      refreshToken,
    };
  }

  private async signAccessToken(userId: string, sessionId: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        sessionId,
        tokenType: 'access',
      },
      {
        secret: this.config.jwtAccessSecret,
        expiresIn: this.config.accessTokenTtl,
      },
    );
  }

  private async signRefreshToken(userId: string, sessionId: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        sessionId,
        tokenType: 'refresh',
      },
      {
        secret: this.config.jwtRefreshSecret,
        expiresIn: this.config.refreshTokenTtl,
        jwtid: createSessionId(),
      },
    );
  }

  private async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.jwtRefreshSecret,
      });

      if (payload.tokenType !== 'refresh') {
        throw new Error('Unexpected token type.');
      }

      return payload;
    } catch {
      throw this.invalidRefreshToken();
    }
  }

  private invalidRefreshToken(): AppException {
    return new AppException({
      status: 401,
      code: 'invalid_refresh_token',
      message: 'Refresh token is invalid, expired, or revoked.',
    });
  }

  private handleKnownPrismaError(error: unknown): never {
    if (!(error instanceof PrismaClientKnownRequestError) || error.code !== 'P2002') {
      throw error;
    }

    const targets = Array.isArray(error.meta?.target)
      ? error.meta.target.map((target) => String(target))
      : [];

    if (targets.includes('email')) {
      throw new AppException({
        status: 409,
        code: 'email_taken',
        message: 'This email is already registered.',
      });
    }

    if (targets.includes('username')) {
      throw new AppException({
        status: 409,
        code: 'username_taken',
        message: 'This username is already taken.',
      });
    }

    throw new AppException({
      status: 409,
      code: 'conflict',
      message: 'Unable to complete the request due to a data conflict.',
    });
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }
}
