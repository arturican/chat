import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthTokenPayload, CurrentUser } from './auth.types.js';

type AuthCredentials = {
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(credentials: AuthCredentials, reply: FastifyReply) {
    const normalizedEmail = this.normalizeEmail(credentials.email);
    this.ensurePassword(credentials.password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(credentials.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
      },
    });

    this.setAuthCookie(reply, user.id);

    return {
      user: this.toCurrentUser(user),
    };
  }

  async login(credentials: AuthCredentials, reply: FastifyReply) {
    const normalizedEmail = this.normalizeEmail(credentials.email);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.setAuthCookie(reply, user.id);

    return {
      user: this.toCurrentUser(user),
    };
  }

  async getUserFromAccessToken(token: string) {
    const payload = this.verifyAccessToken(token);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toCurrentUser(user);
  }

  private normalizeEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    return normalizedEmail;
  }

  private ensurePassword(password: string) {
    if (password.trim().length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }
  }

  private setAuthCookie(reply: FastifyReply, userId: number) {
    const token = this.signAccessToken(userId);

    reply.setCookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
  }

  private signAccessToken(userId: number) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    return jwt.sign({ sub: userId }, secret, {
      expiresIn: '7d',
    });
  }

  private verifyAccessToken(token: string) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    try {
      const payload = jwt.verify(token, secret);

      if (typeof payload === 'string' || typeof payload.sub !== 'number') {
        throw new UnauthorizedException('Invalid access token');
      }

      return { sub: payload.sub };
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private toCurrentUser(user: { id: number; email: string; createdAt: Date }): CurrentUser {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
