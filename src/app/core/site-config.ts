export const SITE_NAME = 'Ingesocc S.A.S.';

/**
 * Public domain of the site.
 * TODO: Replace with the real domain before deployment (see README → Despliegue).
 * Current placeholder: https://ingesocc.com
 */
export const SITE_URL = 'https://ingesocc.com';

export const DEFAULT_DESCRIPTION =
  'Ingesocc S.A.S. — arquitectura, ingeniería y construcción con propósito. Obras de infraestructura, industria y salud en Colombia.';

export const LOCALE = 'es_CO';

/** Real company contact data (verified with the client; source: supabase seed). */
export const CONTACT = {
  phone: '+57 312 737 0811',
  email: 'gerencia.ingesocc@gmail.com',
  address: 'Armenia – km 6 vía La Tebaida, Bodega 2',
  whatsapp: 'https://wa.me/573127370811',
} as const;

/** La Holanda: flagship project with its own official microsite. */
export const LA_HOLANDA = {
  name: 'La Holanda',
  microsite: 'https://laholanda.ingesocc.com/',
  location: 'Vía Quimbaya - Alcalá, Vereda Jazmín, Quimbaya, Quindío',
} as const;