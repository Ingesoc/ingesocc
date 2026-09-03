import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { HomeComponent } from './features/home/home.component';
import { AboutComponent } from './features/about/about.component';
import { ServicesPageComponent } from './features/services/public/services-page.component';
import { ProjectsPageComponent } from './features/projects/public/projects-page.component';
import { ProjectDetailComponent } from './features/projects/public/project-detail.component';
import { ContactComponent } from './features/contact/contact.component';
import { authGuard } from './features/auth/auth.guard';

/** Rutas públicas (plan, sección 6). */
export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        data: {
          title: 'Inicio',
          description:
            'Arquitectura, ingeniería y construcción con propósito. Conozca los proyectos y servicios de Ingesocc S.A.S. en Colombia.',
        },
      },
      {
        path: 'quienes-somos',
        component: AboutComponent,
        data: {
          title: 'Quiénes Somos',
          description:
            'Trayectoria, misión, visión y equipo de Ingesocc S.A.S.: más de 15 años construyendo infraestructura, industria y salud.',
        },
      },
      {
        path: 'servicios',
        component: ServicesPageComponent,
        data: {
          title: 'Servicios',
          description:
            'Proyectos de infraestructura, hospitalarios, industriales, de vivienda, consultoría y diseño, y fabricación metálica a medida.',
        },
      },
      {
        path: 'proyectos',
        component: ProjectsPageComponent,
        data: {
          title: 'Proyectos',
          description:
            'Portafolio de obras de Ingesocc S.A.S.: puentes, estructuras metálicas, edificaciones y proyectos especiales ejecutados.',
        },
      },
      {
        path: 'proyectos/:slug',
        component: ProjectDetailComponent,
        data: {
          title: 'Proyectos',
          description:
            'Detalle de un proyecto ejecutado por Ingesocc S.A.S.: descripción, valor y galería de imágenes.',
        },
      },
      {
        path: 'contacto',
        component: ContactComponent,
        data: {
          title: 'Contacto',
          description:
            'Solicite una cotización o escríbanos: cuéntenos sobre su proyecto y le responderemos a la brevedad.',
        },
      },
    ],
  },

  /** Admin: /admin/login es público; el resto exige sesión con rol admin (authGuard). */
  {
    path: 'admin/login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'proyectos',
        loadComponent: () =>
          import('./features/projects/admin/projects-admin-page.component').then(
            (m) => m.ProjectsAdminPageComponent,
          ),
      },
      { path: 'proyectos/nuevo', loadComponent: () => import('./features/projects/admin/project-form.component').then((m) => m.ProjectFormComponent) },
      { path: 'proyectos/:id', loadComponent: () => import('./features/projects/admin/project-form.component').then((m) => m.ProjectFormComponent) },
      {
        path: 'servicios',
        loadComponent: () =>
          import('./features/services/admin/services-admin-page.component').then(
            (m) => m.ServicesAdminPageComponent,
          ),
      },
      {
        path: 'servicios/nuevo',
        loadComponent: () =>
          import('./features/services/admin/service-form.component').then((m) => m.ServiceFormComponent),
      },
      {
        path: 'servicios/:id',
        loadComponent: () =>
          import('./features/services/admin/service-form.component').then((m) => m.ServiceFormComponent),
      },
      {
        path: 'contenido',
        loadComponent: () =>
          import('./features/admin/admin-placeholder.component').then((m) => m.AdminPlaceholderComponent),
        data: {
          title: 'Contenido del sitio',
          phase: 'Edición in-place',
          description:
            'Los textos e imágenes de las páginas públicas se editan directamente sobre la página: con sesión admin, activa el botón flotante "Modo edición" y usa los lápices sobre cada bloque.',
        },
      },
      {
        path: 'mensajes',
        loadComponent: () =>
          import('./features/contact/admin/messages-inbox.component').then((m) => m.MessagesInboxComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];