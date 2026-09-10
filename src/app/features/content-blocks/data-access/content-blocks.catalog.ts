import type { ContentBlockType } from './content-block.model';

/**
 * Catálogo de metadatos del CMS de contenido (plan §15).
 *
 * Transforma claves técnicas (`hero.title`) en etiquetas amigables
 * ("Título principal") sin modificar los section_key existentes: la clave
 * sigue siendo el identificador interno de la tabla `content_blocks`.
 */

/** Páginas editables, en el orden de navegación del CMS. */
export const CONTENT_PAGES: readonly { key: string; label: string }[] = [
  { key: 'home', label: 'Inicio' },
  { key: 'about', label: 'Quiénes somos' },
  { key: 'contact', label: 'Contacto' },
  { key: 'global', label: 'Global (header / footer)' },
];

const LABELS: Record<string, string> = {
  // global
  'global.cta_label': 'Texto del botón de cotización',
  'global.social_linkedin': 'Enlace de LinkedIn',
  'global.social_facebook': 'Enlace de Facebook',
  'global.social_instagram': 'Enlace de Instagram',
  // home — hero
  'home.hero.title': 'Título principal',
  'home.hero.subtitle': 'Subtítulo de la portada',
  'home.hero.cta_label': 'Texto del botón de la portada',
  'home.hero.background_image': 'Imagen de fondo de la portada',
  // home — estadísticas
  'home.stats.years_experience': 'Años de experiencia',
  'home.stats.projects_executed': 'Proyectos ejecutados',
  'home.stats.sectors_served': 'Sectores atendidos',
  // home — capacidad
  'home.capacidad.title': 'Título de la sección Capacidad',
  'home.capacidad.description': 'Descripción de la sección Capacidad',
  'home.capacidad.card1.title': 'Tarjeta 1 · Título',
  'home.capacidad.card1.description': 'Tarjeta 1 · Descripción',
  'home.capacidad.card2.title': 'Tarjeta 2 · Título',
  'home.capacidad.card2.description': 'Tarjeta 2 · Descripción',
  'home.capacidad.card3.title': 'Tarjeta 3 · Título',
  'home.capacidad.card3.description': 'Tarjeta 3 · Descripción',
  // home — CTA final
  'home.cta.title': 'Título del llamado a la acción final',
  // about — hero / historia
  'about.hero.title': 'Título de la página',
  'about.hero.subtitle': 'Subtítulo de la página',
  'about.historia.image': 'Imagen de la historia',
  'about.historia.text': 'Texto de la historia',
  // about — línea de tiempo
  'about.timeline.item1.title': 'Hito 1 · Título',
  'about.timeline.item1.year': 'Hito 1 · Año',
  'about.timeline.item2.title': 'Hito 2 · Título',
  'about.timeline.item2.year': 'Hito 2 · Año',
  'about.timeline.item3.title': 'Hito 3 · Título',
  'about.timeline.item3.year': 'Hito 3 · Año',
  'about.timeline.item4.title': 'Hito 4 · Título',
  'about.timeline.item4.year': 'Hito 4 · Año',
  // about — misión / visión / valores
  'about.mision.text': 'Misión',
  'about.vision.text': 'Visión',
  'about.valores.text': 'Valores',
  // about — equipo
  'about.equipo.member1.name': 'Miembro 1 · Nombre',
  'about.equipo.member1.role': 'Miembro 1 · Cargo',
  'about.equipo.member1.photo': 'Miembro 1 · Foto',
  'about.equipo.member2.name': 'Miembro 2 · Nombre',
  'about.equipo.member2.role': 'Miembro 2 · Cargo',
  'about.equipo.member2.photo': 'Miembro 2 · Foto',
  'about.equipo.member3.name': 'Miembro 3 · Nombre',
  'about.equipo.member3.role': 'Miembro 3 · Cargo',
  'about.equipo.member3.photo': 'Miembro 3 · Foto',
  'about.equipo.member4.name': 'Miembro 4 · Nombre',
  'about.equipo.member4.role': 'Miembro 4 · Cargo',
  'about.equipo.member4.photo': 'Miembro 4 · Foto',
  // contact
  'contact.title': 'Título de la página',
  'contact.subtitle': 'Subtítulo de la página',
  'contact.phone': 'Teléfono',
  'contact.email': 'Correo electrónico',
  'contact.address': 'Dirección',
  'contact.privacy_note': 'Nota de privacidad',
};

const DESCRIPTIONS: Record<string, string> = {
  'home.hero.title': 'Titular grande de la portada (Home).',
  'home.hero.subtitle': 'Texto de apoyo debajo del titular.',
  'home.hero.background_image': 'Foto de fondo de la sección principal del Home.',
  'home.stats.years_experience': 'Número mostrado en la banda de estadísticas.',
  'home.stats.projects_executed': 'Número mostrado en la banda de estadísticas.',
  'home.stats.sectors_served': 'Número mostrado en la banda de estadísticas.',
  'contact.phone': 'Se muestra en la página de contacto.',
  'contact.email': 'Se muestra en la página de contacto.',
  'contact.address': 'Se muestra en la página de contacto.',
  'global.cta_label': 'Aparece en los botones de cotización de todo el sitio.',
};

const GROUP_LABELS: Record<string, string> = {
  hero: 'Portada',
  stats: 'Estadísticas',
  capacidad: 'Capacidad',
  cta: 'Llamado a la acción',
  historia: 'Historia',
  timeline: 'Línea de tiempo',
  mision: 'Misión',
  vision: 'Visión',
  valores: 'Valores',
  equipo: 'Equipo',
  social: 'Redes sociales',
};

/** Etiqueta amigable de un bloque (con respaldo legible para claves nuevas). */
export function blockLabel(page: string, sectionKey: string): string {
  return (
    LABELS[`${page}.${sectionKey}`] ??
    LABELS[sectionKey] ??
    prettifyKey(sectionKey)
  );
}

/** Descripción opcional de un bloque ('' si no hay). */
export function blockDescription(page: string, sectionKey: string): string {
  return DESCRIPTIONS[`${page}.${sectionKey}`] ?? DESCRIPTIONS[sectionKey] ?? '';
}

/** Título de grupo dentro de una página (prefijo del section_key). */
export function sectionGroupLabel(sectionKey: string): string {
  const prefix = sectionKey.split('.')[0];
  return GROUP_LABELS[prefix] ?? 'General';
}

/** 'hero.title' → 'Hero title'; 'privacy_note' → 'Privacy note'. */
function prettifyKey(sectionKey: string): string {
  return sectionKey
    .split(/[._]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Tipo efectivo de un bloque (para elegir el editor). */
export type { ContentBlockType };
