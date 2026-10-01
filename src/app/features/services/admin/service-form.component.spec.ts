import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ServicesService } from '../data-access/services.service';
import { ServiceFormComponent } from './service-form.component';

describe('ServiceFormComponent', () => {
  let fixture: ComponentFixture<ServiceFormComponent>;
  let revoke: jasmine.Spy;

  const LOCAL_URL = 'blob:ingesocc/preview-1';
  const REMOTE_URL = 'https://res.cloudinary.com/ingesocc/image/upload/services/existing.jpg';

  beforeEach(async () => {
    revoke = spyOn(URL, 'revokeObjectURL');
    TestBed.configureTestingModule({
      imports: [ServiceFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } },
        {
          provide: ServicesService,
          useValue: {
            adminServices: () => [],
            loadAll: jasmine.createSpy('loadAll').and.resolveTo(undefined),
            byId: () => null,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(ServiceFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('crea un preview local y no lo revoca hasta quitarlo o destruir el formulario', () => {
    const component = fixture.componentInstance;
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
    component.photo.set({ url: LOCAL_URL, file });
    expect(revoke).not.toHaveBeenCalled();
  });

  it('revoca el object URL local al reemplazar la foto', () => {
    const component = fixture.componentInstance;
    component.photo.set({ url: LOCAL_URL, file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }) });
    component.removePhoto();

    expect(revoke).toHaveBeenCalledOnceWith(LOCAL_URL);
    expect(component.photo()).toBeNull();
  });

  it('revoca el object URL local al destruir el formulario', () => {
    const component = fixture.componentInstance;
    component.photo.set({ url: LOCAL_URL, file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }) });

    fixture.destroy();

    expect(revoke).toHaveBeenCalledOnceWith(LOCAL_URL);
  });

  it('no revoca URLs remotas (foto ya guardada en Cloudinary o Storage)', () => {
    const component = fixture.componentInstance;
    component.photo.set({ url: REMOTE_URL, existingPath: 'services/existing.jpg' });

    component.removePhoto();
    expect(revoke).not.toHaveBeenCalled();

    component.photo.set({ url: REMOTE_URL, existingPath: 'services/existing.jpg' });
    fixture.destroy();
    expect(revoke).not.toHaveBeenCalled();
  });

  it('rechaza archivos no soportados y no deja preview colgado', () => {
    const component = fixture.componentInstance;
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'doc.pdf', { type: 'application/pdf' })] });
    const event = { target: input } as unknown as Event;

    return component.onPhotoSelected(event).then(() => {
      expect(component.error()).toContain('JPG');
      expect(component.photo()).toBeNull();
      expect(revoke).not.toHaveBeenCalled();
      expect(component.photoBusy()).toBeFalse();
    });
  });
});
