import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
// DEBUG TEMPORAL (diagnóstico panel admin): remover con debug-logger.ts.
import { debugDump, debugLog, enableGlobalErrorOverlay, flushOnLoad } from './app/core/debug-logger';

flushOnLoad();
enableGlobalErrorOverlay();

debugLog.log('main: iniciando bootstrap…');

bootstrapApplication(AppComponent, appConfig)
  .then(() => debugLog.log('main: bootstrap OK'))
  .catch((err) => {
    debugLog.error('main: bootstrap FALLO', err);
    debugDump('fallo de bootstrap');
  });
