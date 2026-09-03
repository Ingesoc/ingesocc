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
      { path: '', component: HomeComponent },
      { path: 'quienes-somos', component: AboutComponent },
      { path: 'servicios', component: ServicesPageComponent },
      { path: 'proyectos', component: ProjectsPageComponent },
      { path: 'proyectos/:slug', component: ProjectDetailComponent },
      { path: 'contacto', component: ContactComponent },
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
          import('./features/admin/admin-placeholder.component').then((m) => m.AdminPlaceholderComponent),
        data: {
          title: 'CRUD Servicios',
          phase: 'Fase 5',
          description: 'Listar, crear, editar y eliminar servicios con foto o ícono de respaldo.',
        },
      },
      {
        path: 'contenido',
        loadComponent: () =>
          import('./features/admin/admin-placeholder.component').then((m) => m.AdminPlaceholderComponent),
        data: {
          title: 'Contenido editable',
          phase: 'Fase 6',
          description:
            'Modo edición de content_blocks: reemplazar textos e imágenes en Home, Quiénes Somos y Contacto.',
        },
      },
      {
        path: 'mensajes',
        loadComponent: () =>
          import('./features/admin/admin-placeholder.component').then((m) => m.AdminPlaceholderComponent),
        data: {
          title: 'Bandeja de mensajes',
          phase: 'Fase 7',
          description: 'Mensajes del formulario de contacto guardados en contact_messages.',
        },
      },
    ],
  },

  { path: '**', redirectTo: '' },
];