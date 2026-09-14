import {
  ApplicationConfig,
  provideZoneChangeDetection,
  // DEBUG TEMPORAL (diagnóstico panel admin): remover con debug-logger.ts.
  ErrorHandler,
} from '@angular/core';
import {
  provideRouter,
  withDebugTracing,
} from '@angular/router';

import { DebugErrorHandler } from './core/debug-logger';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // DEBUG TEMPORAL: withDebugTracing imprime cada evento del router en consola.
    provideRouter(routes, withDebugTracing()),
    { provide: ErrorHandler, useClass: DebugErrorHandler },
  ],
};
