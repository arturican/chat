import type { MessageSendPayload } from '@pulsechat/contracts';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

function normalizeText(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class MessageSendPayloadDto implements MessageSendPayload {
  @Transform(({ value }) => normalizeText(value))
  @IsUUID()
  chatId!: string;

  @Transform(({ value }) => normalizeText(value))
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  clientId!: string;

  @Transform(({ value }) => normalizeText(value))
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;

  @Transform(({ value }) => normalizeText(value))
  @IsOptional()
  @IsUUID()
  replyToMessageId!: string | null;
}
