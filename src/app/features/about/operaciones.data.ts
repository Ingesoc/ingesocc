/**
 * Galería "Operaciones en ejecución" (Quiénes Somos).
 *
 * Fotos y video reales de obra servidos por el CDN de Cloudinary
 * (`ingesocc/content/operaciones/`).
 * Para cambiar títulos, agrupar o quitar elementos, edita solo este archivo:
 * la plantilla lee TODO desde aquí.
 */

export interface OperacionMedia {
  /** Ruta pública del asset (bajo `public/`). */
  src: string;
  /** Texto alternativo descriptivo de la operación. */
  alt: string;
  type: 'image' | 'video';
}

export interface OperacionGrupo {
  key: string;
  label: string;
  media: OperacionMedia[];
}

export const OPERACIONES: OperacionGrupo[] = [
  {
    key: 'montaje',
    label: 'Montaje de puentes y estructuras',
    media: [
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804308/ingesocc/content/operaciones/montaje-puente-con-grua.webp', alt: 'Montaje de puente metálico con grúa', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804304/ingesocc/content/operaciones/izaje-viga-metalica-puente.webp', alt: 'Izaje de viga metálica de puente', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804300/ingesocc/content/operaciones/estructura-metalica-del-puente.webp', alt: 'Estructura metálica del puente', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804312/ingesocc/content/operaciones/puente-estructura-desde-el-terreno.webp', alt: 'Estructura del puente vista desde el terreno', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804313/ingesocc/content/operaciones/puente-vista-aerea-01.webp', alt: 'Puente terminado, vista aérea', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804314/ingesocc/content/operaciones/puente-vista-aerea-02.webp', alt: 'Puente en operación, vista aérea', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804311/ingesocc/content/operaciones/puente-baranda-amarilla.webp', alt: 'Puente con baranda de seguridad amarilla', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804311/ingesocc/content/operaciones/puente-entrepiso-metalico.webp', alt: 'Entrepiso metálico de puente', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804303/ingesocc/content/operaciones/instalacion-en-puente-nocturna.webp', alt: 'Instalación nocturna sobre el puente', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804315/ingesocc/content/operaciones/refuerzo-de-puente-en-obra-nocturna.webp', alt: 'Refuerzo del puente en obra nocturna', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804316/ingesocc/content/operaciones/refuerzo-metalico-de-puente.webp', alt: 'Refuerzo metálico de puente', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804292/ingesocc/content/operaciones/armado-de-losa-de-puente.webp', alt: 'Armado de losa del puente', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804292/ingesocc/content/operaciones/apoyo-metalico-sobre-estribo.webp', alt: 'Apoyo metálico sobre estribo del puente', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804296/ingesocc/content/operaciones/detalle-de-estructura-arquitectonica.webp', alt: 'Detalle de estructura arquitectónica', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804299/ingesocc/content/operaciones/estructura-arquitectonica-fachada.webp', alt: 'Estructura arquitectónica de fachada', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804323/ingesocc/content/operaciones/trabajadores-montando-viga-metalica.webp', alt: 'Trabajadores montando viga metálica', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/video/upload/v1790804306/ingesocc/content/operaciones/montaje-de-puente-en-obra.mp4', alt: 'Video del montaje del puente en obra', type: 'video' },
    ],
  },
  {
    key: 'soldadura',
    label: 'Soldadura e inspección',
    media: [
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804295/ingesocc/content/operaciones/control-de-calidad-de-soldadura.webp', alt: 'Control de calidad de soldadura', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804298/ingesocc/content/operaciones/equipo-de-inspeccion-de-soldadura.webp', alt: 'Equipo de inspección de soldadura', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804301/ingesocc/content/operaciones/inspeccion-de-soldadura-en-placa.webp', alt: 'Inspección de soldadura en placa', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804302/ingesocc/content/operaciones/inspeccion-de-soldadura-en-viga.webp', alt: 'Inspección de soldadura en viga', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804310/ingesocc/content/operaciones/proceso-de-soldadura-en-viga.webp', alt: 'Proceso de soldadura en viga', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804316/ingesocc/content/operaciones/soldador-en-fabricacion-de-viga.webp', alt: 'Soldador en fabricación de viga', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804317/ingesocc/content/operaciones/soldadura-de-perfiles-metalicos.webp', alt: 'Soldadura de perfiles metálicos', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804318/ingesocc/content/operaciones/soldadura-de-pernos-en-obra.webp', alt: 'Soldadura de pernos en obra', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804318/ingesocc/content/operaciones/soldadura-de-piezas-metalicas.webp', alt: 'Soldadura de piezas metálicas', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804319/ingesocc/content/operaciones/soldadura-de-viga-en-taller.webp', alt: 'Soldadura de viga en taller', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804321/ingesocc/content/operaciones/trabajador-soldando-estructura.webp', alt: 'Trabajador soldando estructura', type: 'image' },
    ],
  },
  {
    key: 'taller',
    label: 'Taller metalúrgico',
    media: [
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804300/ingesocc/content/operaciones/fabricacion-viga-en-taller.webp', alt: 'Fabricación de viga en taller', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804310/ingesocc/content/operaciones/polipasto-en-taller-metalurgico.webp', alt: 'Polipasto en taller metalúrgico', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804309/ingesocc/content/operaciones/placa-metalica-en-taller.webp', alt: 'Placa metálica en taller', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804297/ingesocc/content/operaciones/ensamble-de-viga-con-pernos.webp', alt: 'Ensamble de viga con pernos', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804299/ingesocc/content/operaciones/equipo-de-soldadura-de-pernos.webp', alt: 'Equipo de soldadura de pernos', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804309/ingesocc/content/operaciones/pernos-estructurales.webp', alt: 'Pernos estructurales', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804320/ingesocc/content/operaciones/soportes-metalicos-de-estructura.webp', alt: 'Soportes metálicos de estructura', type: 'image' },
    ],
  },
  {
    key: 'obra-civil',
    label: 'Obra civil y acabados',
    media: [
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804291/ingesocc/content/operaciones/acabados-de-bano-en-obra.webp', alt: 'Acabados de baño en obra', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804295/ingesocc/content/operaciones/bano-con-ducha-y-revestimiento.webp', alt: 'Baño con ducha y revestimiento', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804302/ingesocc/content/operaciones/instalacion-de-lavamanos-en-bano.webp', alt: 'Instalación de lavamanos en baño', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804304/ingesocc/content/operaciones/lavamanos-con-espejo-iluminado.webp', alt: 'Lavamanos con espejo iluminado', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804305/ingesocc/content/operaciones/lavamanos-moderno-terminado.webp', alt: 'Lavamanos moderno terminado', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804322/ingesocc/content/operaciones/trabajadores-en-camion-mezclador.webp', alt: 'Trabajadores en camión mezclador de concreto', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804293/ingesocc/content/operaciones/armadura-de-columna-nocturna.webp', alt: 'Armadura de columna en obra nocturna', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804294/ingesocc/content/operaciones/armadura-de-refuerzo-nocturna.webp', alt: 'Armadura de refuerzo nocturna', type: 'image' },
      { src: 'https://res.cloudinary.com/j5a9xyaq/image/upload/v1790804297/ingesocc/content/operaciones/encofrado-de-columna-en-obra.webp', alt: 'Encofrado de columna en obra', type: 'image' },
    ],
  },
];
