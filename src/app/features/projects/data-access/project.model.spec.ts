import {
  projectCoverUrl,
  projectImageAlt,
  projectImageCaption,
  projectLocation,
  type Project,
  type ProjectImage,
} from './project.model';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    title: 'Proyecto',
    slug: 'proyecto',
    description: 'Descripción',
    priceMinWages: null,
    status: 'published',
    featured: false,
    sortOrder: 1,
    categories: [],
    images: [],
    ...overrides,
  };
}

describe('Project.externalUrl (opcional y genérico)', () => {
  it('acepta proyectos sin enlace externo (campo ausente)', () => {
    const project = makeProject();
    expect(project.externalUrl ?? null).toBeNull();
  });

  it('acepta el enlace del micrositio oficial cuando el proyecto lo tiene', () => {
    const project = makeProject({
      title: 'La Holanda',
      slug: 'la-holanda',
      externalUrl: 'https://laholanda.ingesocc.com/',
    });
    expect(project.externalUrl).toBe('https://laholanda.ingesocc.com/');
  });
});

describe('projectCoverUrl', () => {
  it('usa la imagen marcada como portada', () => {
    const project = makeProject({
      images: [
        { url: 'https://x.test/portada.jpg', isCover: true },
        { url: 'https://x.test/otra.jpg', isCover: false },
      ],
    });
    expect(projectCoverUrl(project)).toBe('https://x.test/portada.jpg');
  });

  it('cae a la primera imagen si ninguna es portada', () => {
    const project = makeProject({
      images: [{ url: 'https://x.test/a.jpg', isCover: false }],
    });
    expect(projectCoverUrl(project)).toBe('https://x.test/a.jpg');
  });

  it('devuelve cadena vacía sin imágenes', () => {
    expect(projectCoverUrl(makeProject())).toBe('');
  });
});

describe('projectLocation', () => {
  it('devuelve la ubicación de la obra cuando existe', () => {
    const project = makeProject({
      title: 'La Holanda',
      location: 'Vía Quimbaya - Alcalá, Vereda Jazmín, Quimbaya, Quindío',
    });
    expect(projectLocation(project)).toBe('Vía Quimbaya - Alcalá, Vereda Jazmín, Quimbaya, Quindío');
  });

  it('devuelve cadena vacía si el proyecto no tiene ubicación', () => {
    expect(projectLocation(makeProject())).toBe('');
    expect(projectLocation(makeProject({ location: null }))).toBe('');
    expect(projectLocation(makeProject({ location: '   ' }))).toBe('');
  });

  it('es independiente de la dirección corporativa (que vive en content_blocks)', () => {
    // La sede de Ingesocc (Armenia) nunca debe aparecer como ubicación del proyecto.
    const project = makeProject({ location: 'Vía Quimbaya - Alcalá, Quimbaya, Quindío' });
    expect(projectLocation(project)).not.toContain('Tebaida');
  });
});

describe('projectImageAlt', () => {
  const image = (overrides: Partial<ProjectImage> = {}): ProjectImage => ({
    url: 'https://x.test/a.jpg',
    isCover: false,
    ...overrides,
  });

  it('usa el alt que diligently el admin', () => {
    expect(projectImageAlt(image({ alt: 'Losa de fundación terminada' }), 'La Holanda')).toBe(
      'Losa de fundación terminada',
    );
  });

  it('cae al título de la imagen cuando no hay alt', () => {
    expect(projectImageAlt(image({ title: 'CYP, cubierta' }), 'La Holanda')).toBe('CYP, cubierta');
  });

  it('cae a un texto neutro cuando no hay alt ni título', () => {
    expect(projectImageAlt(image(), 'La Holanda')).toBe('Imagen del proyecto La Holanda');
  });

  it('ignora espacios en blanco en lugar de producir un alt vacío', () => {
    expect(projectImageAlt(image({ alt: '   ', title: '  ' }), 'La Holanda')).toBe(
      'Imagen del proyecto La Holanda',
    );
  });

  it('nunca devuelve cadena vacía (un alt vacío no lo anuncia el lector de pantalla)', () => {
    for (const overrides of [{}, { alt: null }, { alt: '' }, { alt: '  ', title: null }]) {
      expect(projectImageAlt(image(overrides), 'La Holanda').length).toBeGreaterThan(0);
    }
  });
});

describe('projectImageCaption', () => {
  it('es true si la imagen tiene título o descripción', () => {
    expect(projectImageCaption({ url: 'x', isCover: false, title: 'T' })).toBeTrue();
    expect(projectImageCaption({ url: 'x', isCover: false, description: 'D' })).toBeTrue();
  });

  it('es false si no hay nada visible que mostrar', () => {
    expect(projectImageCaption({ url: 'x', isCover: false })).toBeFalse();
    expect(projectImageCaption({ url: 'x', isCover: false, title: '  ', description: '' })).toBeFalse();
  });

  it('ignora la categoría y el alt: no son caption', () => {
    expect(projectImageCaption({ url: 'x', isCover: false, alt: 'A', category: 'Estructura' })).toBeFalse();
  });
});
