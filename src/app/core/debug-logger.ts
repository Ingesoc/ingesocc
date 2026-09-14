import { ErrorHandler, Injectable } from '@angular/core';

/**
 * DEBUG TEMPORAL (diagnóstico del panel admin en blanco).
 * Logger con búfer en memoria + volcado a consola, handlers globales de error
 * y overlay en pantalla. REMOVER cuando se cierre el diagnóstico.
 */

const TAG = '[ingesocc-debug]';
const MAX_ENTRIES = 80;
const buffer: string[] = [];

// Integra los eventos tempranos capturados por el snippet de index.html
// (ventana entre el primer HTML y la carga de main.js).
const earlyLines = (window as unknown as { __earlyDebugLines?: string[] }).__earlyDebugLines;
if (Array.isArray(earlyLines)) {
  for (const line of earlyLines) buffer.push(line);
}

function stamp(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

function format(parts: unknown[]): string {
  return parts
    .map((p) => {
      if (p instanceof Error) {
        const stack = typeof p.stack === 'string' ? p.stack.split('\n').slice(0, 6).join(' | ') : '';
        return `${p.name}: ${p.message}${stack ? ` :: ${stack}` : ''}`;
      }
      if (typeof p === 'object' && p !== null) {
        try {
          return JSON.stringify(p);
        } catch {
          return String(p);
        }
      }
      return String(p);
    })
    .join(' ');
}

function emit(level: 'log' | 'warn' | 'error', parts: unknown[]): void {
  const line = `${TAG} ${stamp()} ${format(parts)}`;
  buffer.push(line);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
  // eslint-disable-next-line no-console
  (level === 'log' ? console.info : console[level]).call(console, line);
}

export const debugLog = {
  log: (...parts: unknown[]) => emit('log', parts),
  warn: (...parts: unknown[]) => emit('warn', parts),
  error: (...parts: unknown[]) => emit('error', parts),
};

/** Vuelca el historial completo a la consola (para copiar y compartir). */
export function debugDump(reason: string): void {
  // eslint-disable-next-line no-console
  console.warn(`${TAG} DUMP (${reason}) — ${buffer.length} eventos; copia TODO lo siguiente:`);
  for (const line of buffer) {
    // eslint-disable-next-line no-console
    console.info(line);
  }
  // eslint-disable-next-line no-console
  console.warn(`${TAG} fin del dump`);
}

declare global {
  interface Window {
    __ingesoccDebugDump?: () => void;
  }
}

/** Handlers globales: promesas sin catch y errores fuera de Angular. */
export function enableGlobalErrorOverlay(): void {
  window.addEventListener('unhandledrejection', (event) => {
    debugLog.error('unhandledrejection:', event.reason);
    overlay(event.reason);
  });
  window.addEventListener('error', (event) => {
    debugLog.error('window.onerror:', event.message, event.filename ? `${event.filename}:${event.lineno}` : '');
  });
  window.__ingesoccDebugDump = () => debugDump('manual (window.__ingesoccDebugDump)');
}

/**
 * ErrorHandler de Angular: captura errores que la app se traga en silencio
 * (p. ej. al inicializar un componente lazy del panel) y los muestra en
 * pantalla además de en consola.
 */
@Injectable()
export class DebugErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    debugLog.error('ErrorHandler:', error);
    overlay(error);
    // No re-lanza: objetivo de diagnóstico.
  }
}

/** Bandera roja visual en pantalla con cada error capturado. */
function overlay(error: unknown): void {
  try {
    const ID = '__ingesocc_error_overlay';
    let box = document.getElementById(ID) as HTMLPreElement | null;
    if (!box) {
      box = document.createElement('pre');
      box.id = ID;
      box.setAttribute(
        'style',
        [
          'position:fixed',
          'z-index:2147483647',
          'left:0',
          'right:0',
          'bottom:0',
          'max-height:45vh',
          'overflow:auto',
          'margin:0',
          'padding:10px 12px',
          'background:#2b0d0d',
          'color:#ffd9d9',
          'font:12px/1.5 monospace',
          'white-space:pre-wrap',
          'border-top:2px solid #f25623',
        ].join(';'),
      );
      (document.body ?? document.documentElement).appendChild(box);
    }
    box.textContent += `${stamp()} ${format([error])}\n`;
  } catch {
    /* overlay best-effort */
  }
}

/** Al terminar de cargar la página vuelca el historial a la consola. */
export function flushOnLoad(): void {
  if (document.readyState === 'complete') {
    window.setTimeout(() => debugDump('página cargada'), 1500);
    return;
  }
  window.addEventListener('load', () => window.setTimeout(() => debugDump('página cargada'), 1500));
}
