import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { ProjectsService } from '../projects/data-access/projects.service';
import { ServicesService } from '../services/data-access/services.service';
import { ContentBlocksService } from '../content-blocks/data-access/content-blocks.service';
import { ContactMessagesService } from '../contact/data-access/contact-messages.service';

describe('AdminDashboardComponent', () => {
  let messagesStub: {
    messages: () => { read: boolean }[];
    unreadCount: () => number;
    load: jasmine.Spy;
  };

  function createComponent(): import('@angular/core/testing').ComponentFixture<AdminDashboardComponent> {
    return TestBed.createComponent(AdminDashboardComponent);
  }

  beforeEach(() => {
    messagesStub = {
      messages: () => [{ read: false }, { read: true }],
      unreadCount: () => 1,
      load: jasmine.createSpy('load').and.resolveTo(undefined),
    };
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        // RouterLink (links del template) necesita el router aunque la suite
        // no navegue.
        provideRouter([]),
        { provide: ProjectsService, useValue: { published: () => [{}], featured: () => [{}] } },
        { provide: ServicesService, useValue: { published: () => [{}] } },
        { provide: ContentBlocksService, useValue: { byPage: () => ({ home: { a: {} } }) } },
        { provide: ContactMessagesService, useValue: messagesStub },
      ],
    });
  });

  it('calcula los contadores del dashboard', () => {
    const fixture = createComponent();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.cards().length).toBe(4);
    expect(component.cards()[3].value).toBe('1');
    expect(component.cards()[3].detail).toContain('2 en total');
  });

  it('carga los mensajes al iniciar y apaga el loading', async () => {
    const fixture = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(messagesStub.load).toHaveBeenCalled();
    expect(fixture.componentInstance.loadingMessages()).toBeFalse();
    expect(fixture.componentInstance.messagesError()).toBe('');
  });

  it('muestra el estado de error cuando la carga de mensajes falla', async () => {
    messagesStub.load.and.rejectWith(new Error('RLS denegado'));
    const fixture = createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges(); // re-render con la señal de error ya poblada

    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(fixture.componentInstance.messagesError()).toContain('No se pudieron cargar los mensajes');
    expect(html).toContain('No se pudieron cargar los mensajes');
  });
});
