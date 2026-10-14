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
 * Respaldo genérico de entregables si el servicio no define los suyos (columna
 * `deliverables` en null). Copy de diseño [PENDIENTE: validar con el cliente].
 */
const DEFAULT_DELIVERABLES: readonly string[] = [
  'Levantamiento y diagnóstico inicial',
  'Diseño y documentación técnica',
  'Ejecución con control de calidad',
  'Entrega, documentación y acompañamiento',
];

/**
 * Preguntas frecuentes genéricas del detalle (diseño), usadas cuando el
 * servicio no define las suyas (`faq` en null).
 * Content decided by the client later [PENDIENTE: validar con el cliente].
 */
const DEFAULT_FAQ: readonly { q: string; a: string }[] = [
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

  /** Párrafo de alcance: el propio del servicio o, si no, su descripción. */
  readonly scope = computed(() => {
    const service = this.service();
    return service?.scope?.trim() || service?.description || '';
  });

  /** Entregables del servicio (respaldo genérico si no define los suyos). */
  readonly deliverables = computed(() => {
    const own = this.service()?.deliverables;
    return own && own.length > 0 ? own : DEFAULT_DELIVERABLES;
  });

  /** Preguntas frecuentes del servicio (respaldo genérico si no define ninguna). */
  readonly faq = computed(() => {
    const own = this.service()?.faq;
    return own && own.length > 0 ? own : DEFAULT_FAQ;
  });

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