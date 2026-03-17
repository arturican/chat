import type { AuthIdentifyPayload } from '@pulsechat/contracts';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

function normalizeText(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class AuthIdentifyPayloadDto implements AuthIdentifyPayload {
  @Transform(({ value }) => normalizeText(value))
  @IsString()
  @MinLength(1)
  accessToken!: string;
}
