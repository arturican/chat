import type { CreateMessageRequest } from '@pulsechat/contracts';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

function normalizeText(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateMessageRequestDto implements CreateMessageRequest {
  @Transform(({ value }) => normalizeText(value))
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;

  @Transform(({ value }) => normalizeText(value))
  @IsOptional()
  @IsUUID()
  replyToMessageId?: string | null;
}
