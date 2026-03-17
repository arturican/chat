import type { CreateGroupChatRequest } from '@pulsechat/contracts';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const usernamePattern = /^[a-z0-9_]+$/;

function normalizeText(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeUsernames(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((entry) => (typeof entry === 'string' ? entry.trim().toLowerCase() : entry));
}

export class CreateGroupChatRequestDto implements CreateGroupChatRequest {
  @Transform(({ value }) => normalizeText(value))
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title!: string;

  @Transform(({ value }) => normalizeUsernames(value))
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MinLength(3, { each: true })
  @MaxLength(32, { each: true })
  @Matches(usernamePattern, { each: true })
  memberUsernames!: string[];
}
