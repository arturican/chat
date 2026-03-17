import type { ChatMessagesQuery } from '@pulsechat/contracts';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

function normalizeString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeInteger(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.parseInt(value, 10);
  }

  return value;
}

export class ChatMessagesQueryDto implements ChatMessagesQuery {
  @Transform(({ value }) => normalizeString(value))
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @Transform(({ value }) => normalizeInteger(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
