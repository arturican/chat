import type { RegisterRequest } from '@pulsechat/contracts';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const usernamePattern = /^[a-z0-9_]+$/;

function normalizeText(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class RegisterRequestDto implements RegisterRequest {
  @Transform(({ value }) => normalizeText(value))
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @Transform(({ value }) => normalizeText(value))
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(usernamePattern)
  username!: string;
}
