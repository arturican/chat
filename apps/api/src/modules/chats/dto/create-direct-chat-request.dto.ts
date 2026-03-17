import type { CreateDirectChatRequest } from '@pulsechat/contracts';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const usernamePattern = /^[a-z0-9_]+$/;

function normalizeUsername(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreateDirectChatRequestDto implements CreateDirectChatRequest {
  @Transform(({ value }) => normalizeUsername(value))
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(usernamePattern)
  username!: string;
}
