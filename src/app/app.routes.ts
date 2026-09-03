import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { HomeComponent } from './features/home/home.component';
import { AboutComponent } from './features/about/about.component';
import { ServicesPageComponent } from './features/services/public/services-page.component';
import { ProjectsPageComponent } from './features/projects/public/projects-page.component';
import { ProjectDetailComponent } from './features/projects/public/project-detail.component';
import { ContactComponent } from './features/contact/contact.component';
import { LoginComponent } from './features/auth/login.component';
import { authGuard } from './features/auth/auth.guard';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { AdminPlaceholderComponent } from './features/admin/admin-placeholder.component';

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
  { path: 'admin/login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      {
        path: 'proyectos',
        component: AdminPlaceholderComponent,
        data: {
          title: 'CRUD Proyectos',
          phase: 'Fase 4',
          description:
            'Listar, crear, editar y eliminar proyectos, subir imágenes, asignar categorías, destacar en el Home y paginar el listado público.',
        },
      },
      {
        path: 'servicios',
        component: AdminPlaceholderComponent,
        data: {
          title: 'CRUD Servicios',
          phase: 'Fase 5',
          description: 'Listar, crear, editar y eliminar servicios con foto o ícono de respaldo.',
        },
      },
      {
        path: 'contenido',
        component: AdminPlaceholderComponent,
        data: {
          title: 'Contenido editable',
          phase: 'Fase 6',
          description:
            'Modo edición de content_blocks: reemplazar textos e imágenes en Home, Quiénes Somos y Contacto.',
        },
      },
      {
        path: 'mensajes',
        component: AdminPlaceholderComponent,
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