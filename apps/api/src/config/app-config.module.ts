import { Global, Module } from '@nestjs/common';

import { APP_CONFIG } from './app-config.constants';
import { loadAppConfig } from './app-config';

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: () => loadAppConfig(globalThis.process.env),
    },
  ],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
