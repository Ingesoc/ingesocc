/**
 * Allowlist de esquemas para enlaces construidos con contenido dinámico
 * (CMS, `external_url` de proyectos, redes sociales, WhatsApp…).
 *
 * Angular ya sanea los bindings `[href]`, pero esta validación explícita evita
 * depender solo del sanitizador y bloquea esquemas peligrosos antes de pintar
 * el enlace. No se usa `bypassSecurityTrustUrl` en ningún caso.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseHref(value: string): URL | null {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://localhost';
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

/** true si el valor es un enlace con un protocolo permitido. */
export function isAllowedHref(value: string | null | undefined): boolean {
  const raw = value?.trim();
  if (!raw) return false;

  const url = parseHref(raw);
  return url !== null && ALLOWED_PROTOCOLS.has(url.protocol);
}

/**
 * Devuelve el valor original (recortado) si su protocolo está permitido;
 * `null` en caso contrario (la plantilla oculta el enlace).
 */
export function safeHref(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw || !isAllowedHref(raw)) return null;
  return raw;
}

/** Enlace `tel:` a partir de un teléfono, o `null` si no quedan dígitos. */
export function toTelHref(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/[^+\d]/g, '');
  return digits ? `tel:${digits}` : null;
}

/** Enlace `mailto:` a partir de un correo válido, o `null` si no lo es. */
export function toMailtoHref(email: string | null | undefined): string | null {
  const value = email?.trim() ?? '';
  return EMAIL_PATTERN.test(value) ? `mailto:${value}` : null;
}
