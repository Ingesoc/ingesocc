import { Component, computed, effect, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LucideArrowUpRight, LucideMessageCircle } from '@lucide/angular';
import type { LucideIcon } from '@lucide/angular';
import { SeoService } from '../../../core/seo.service';
import { CLOUDINARY_TRANSFORMS, withCloudinaryTransform } from '../../../core/cloudinary-urls';
import { CONTACT } from '../../../core/site-config';
import { ContentBlocksService } from '../../content-blocks/data-access/content-blocks.service';
import { ServicesService } from '../data-access/services.service';
import { serviceIconFor } from '../data-access/service-icons';
import { ProjectsService } from '../../projects/data-access/projects.service';
import { ProjectCardComponent } from '../../projects/public/project-card.component';

/**
 * Entregables típicos por línea de servicio.
 * Copy genérica de diseño [PENDIENTE: validar con el cliente].
 */
const DELIVERABLES: Record<string, readonly string[]> = {
  'proyectos-de-infraestructura': [
    'Estudios y diseños preliminares',
    'Gerencia de obra e interventoría',
    'Construcción de obras civiles',
    'Entrega y puesta en servicio',
  ],
  'proyectos-hospitalarios': [
    'Adecuación y montaje de áreas asistenciales',
    'Instalaciones y redes hospitalarias',
    'Acabados y control de bioseguridad',
    'Documentación y puesta en marcha',
  ],
  'proyectos-industriales': [
    'Obra civil para nave industrial',
    'Estructuras metálicas y cubiertas',
    'Instalaciones técnicas industriales',
    'Montaje y puesta en marcha',
  ],
  'consultoria-y-diseno': [
    'Levantamientos y diagnóstico',
    'Diseño arquitectónico y estructural',
    'Documentos técnicos y memorias',
    'Acompañamiento en licencias',
  ],
  'fabricacion-metalica': [
    'Diseño y despiece técnico',
    'Fabricación en taller',
    'Recubrimiento anticorrosivo',
    'Montaje en sitio',
  ],
  'proyectos-de-vivienda': [
    'Diseño y legalización del proyecto',
    'Construcción de vivienda',
    'Urbanismo y zonas comunes',
    'Entrega de obra y acompañamiento',
  ],
};

/** Respaldo si un slug futuro aún no tiene entregables definidos. */
const DEFAULT_DELIVERABLES: readonly string[] = [
  'Levantamiento y diagnóstico inicial',
  'Diseño y documentación técnica',
  'Ejecución con control de calidad',
  'Entrega, documentación y acompañamiento',
];

/**
 * Preguntas frecuentes genéricas del detalle (diseño).
 * Content decided by the client later [PENDIENTE: validar con el cliente].
 */
const FAQ: readonly { q: string; a: string }[] = [
  {
    q: '¿Cómo se cotiza un proyecto?',
    a: 'Con la información del proyecto (planos, fotos o una visita) preparamos una cotización a la brevedad.',
  },
  {
    q: '¿En qué zonas se presta el servicio?',
    a: 'Nos especializamos en el Quindío y el Eje Cafetero; proyectos en otras regiones se evalúan puntualmente.',
  },
  {
    q: '¿Ejecutan diseños propios o de terceros?',
    a: 'Ambos: desarrollamos consultoría y diseño propios, y ejecutamos proyectos diseñados por otras firmas.',
  },
];

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [RouterLink, NgComponentOutlet, LucideArrowUpRight, LucideMessageCircle, ProjectCardComponent],
  templateUrl: './service-detail.component.html',
})
export class ServiceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly services = inject(ServicesService);
  private readonly projects = inject(ProjectsService);
  private readonly blocks = inject(ContentBlocksService);
  private readonly seo = inject(SeoService);

  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))));

  /** Servicio público de la URL; undefined → "Servicio no encontrado". */
  readonly service = computed(() => this.services.bySlug(this.slug() ?? ''));

  /** Ícono de respaldo si el servicio no tiene foto (misma lógica que la card). */
  readonly iconComponent = computed<LucideIcon | null>(() => serviceIconFor(this.service()?.iconName));

  /** Foto de cabecera ya optimizada por el CDN (las legacy salen intactas). */
  readonly photoUrl = computed(() =>
    withCloudinaryTransform(this.service()?.photoUrl ?? '', CLOUDINARY_TRANSFORMS.service),
  );

  /** Entregables del servicio (respaldo genérico si el slug no está mapeado). */
  readonly deliverables = computed(() => {
    const slug = this.service()?.slug ?? '';
    return DELIVERABLES[slug] ?? DEFAULT_DELIVERABLES;
  });

  readonly faq = FAQ;

  /** Proyectos relacionados: primeras obras publicadas [PENDIENTE: mapear por área]. */
  readonly relatedProjects = computed(() => this.projects.published().slice(0, 3));

  /** WhatsApp del CTA final (contact.whatsapp; fallo: dato real verificado). */
  readonly whatsappUrl = computed(() => this.blocks.text('contact', 'whatsapp', CONTACT.whatsapp));

  constructor() {
    // SEO dinámico por servicio: título y descripción propios.
    effect(() => {
      const service = this.service();
      if (service) {
        this.seo.set(service.name, service.description);
      }
    });
  }
}