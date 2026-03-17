import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@pulsechat/contracts';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
