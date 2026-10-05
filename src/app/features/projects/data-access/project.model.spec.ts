import { projectCoverUrl, type Project } from './project.model';

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
