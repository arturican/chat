import { Module } from '@nestjs/common';

import { AuthModule } from './modules/auth/auth.module.js';
import { HealthController } from './modules/health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HealthController],
})
export class AppModule {}
