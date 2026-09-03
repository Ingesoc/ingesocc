-- ============================================================================
-- Ingesocc SAS — Datos semilla (Fases 1 y 2)
-- Aplicar después de schema.sql. Idempotente: se puede re-ejecutar sin romper.
-- Mantiene el mismo contenido que los seeds estáticos de la app (Fase 2):
--   features/content-blocks/data-access/content-blocks.service.ts
--   features/projects/data-access/projects.service.ts
--   features/services/data-access/services.service.ts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Categorías (sección 1.2 del plan — las 4 reales del filtro)
-- ----------------------------------------------------------------------------
insert into public.categories (name, slug, sort_order) values
  ('Edificaciones',          'edificaciones',          1),
  ('Estructuras Metálicas',  'estructuras-metalicas',  2),
  ('Puentes',                'puentes',                3),
  ('Proyectos Especiales',   'proyectos-especiales',   4)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Servicios (sección 1.3 del plan — los 6 del maquetado como semilla)
-- sort_order prioriza infraestructura / hospitalario / industrial sobre vivienda
-- photo_path: mismas URLs de Unsplash que los seeds estáticos (services.service.ts)
-- para que el sitio se vea igual con la DB aplicada que sin ella (plan 1.7/§22).
-- ----------------------------------------------------------------------------
insert into public.services (name, slug, description, icon_name, photo_path, status, sort_order) values
  ('Proyectos de Infraestructura', 'proyectos-de-infraestructura',
   'Desarrollamos puentes, obras civiles y grandes estructuras que conectan comunidades y fomentan el progreso',
   null, 'https://images.unsplash.com/photo-1504307651254-35680f583dfb?auto=format&fit=crop&w=1200&q=85', 'published', 1),
  ('Proyectos Hospitalarios', 'proyectos-hospitalarios',
   'Construcción especializada de centros de salud, cumpliendo con los más altos estándares de calidad y funcionalidad',
   null, 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=85', 'published', 2),
  ('Proyectos Industriales', 'proyectos-industriales',
   'Fabricamos e instalamos naves industriales, plantas de producción y bodegas optimizadas para la eficiencia operativa',
   'factory', null, 'published', 3),
  ('Consultoría y Diseño', 'consultoria-y-diseno',
   'Acompañamos desde la conceptualización, ofreciendo diseños innovadores y viables que optimizan recursos y garantizan resultados',
   'ruler', null, 'published', 4),
  ('Fabricación Metálica', 'fabricacion-metalica',
   'Especialistas en la fabricación a medida de estructuras metálicas de alta precisión para cualquier tipo de proyecto',
   'frame', null, 'published', 5),
  ('Proyectos de Vivienda', 'proyectos-de-vivienda',
   'Ejecutamos proyectos de vivienda unifamiliar y multifamiliar con diseños modernos y estructuras duraderas',
   'home', null, 'published', 6)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- content_blocks (sección 1.4 del plan — inventario completo por página)
-- Las imágenes usan las mismas URLs de Unsplash que los seeds estáticos de la
-- app (content-blocks.service.ts) para que el sitio se vea igual con la DB
-- aplicada que sin ella (plan 1.7/§22). El admin puede reemplazarlas después.
-- ----------------------------------------------------------------------------
insert into public.content_blocks (page, section_key, type, value_text, value_number) values
  -- Global (header/footer de todas las páginas)
  ('global', 'cta_label',            'text',   'Solicitar Cotización', null),
  ('global', 'social_linkedin',      'text',   'https://www.linkedin.com/company/ingesocc', null),
  ('global', 'social_facebook',      'text',   'https://www.facebook.com/ingesocc', null),
  ('global', 'social_instagram',     'text',   'https://www.instagram.com/ingesocc', null),
  -- Home — hero y estadísticas
  ('home',   'hero.title',           'text',   'Construimos espacios que trascienden.', null),
  ('home',   'hero.subtitle',        'text',   'Diseñamos y ejecutamos proyectos con precisión, propósito y una visión que permanece.', null),
  ('home',   'hero.cta_label',       'text',   'Hablemos', null),
  ('home',   'stats.years_experience',  'number', null, 15),
  ('home',   'stats.projects_executed', 'number', null, 120),
  ('home',   'stats.sectors_served',    'number', null, 8),
  -- Home — capacidad
  ('home',   'capacidad.title',       'text', 'Nuestra Capacidad a su Servicio', null),
  ('home',   'capacidad.description', 'text', 'Ejecutamos proyectos de infraestructura, industria y salud con equipo técnico propio, taller de fabricación metálica y procesos de calidad.', null),
  ('home',   'capacidad.card1.title', 'text', 'Experiencia Técnica', null),
  ('home',   'capacidad.card1.description', 'text', 'Más de 15 años respaldan cada obra: personal calificado y procesos probados en campo.', null),
  ('home',   'capacidad.card2.title', 'text', 'Fabricación Metálica', null),
  ('home',   'capacidad.card2.description', 'text', 'Taller propio para estructuras y componentes metálicos fabricados a medida con control de calidad.', null),
  ('home',   'capacidad.card3.title', 'text', 'Ingeniería de Precisión', null),
  ('home',   'capacidad.card3.description', 'text', 'Diseño y cálculo estructural bajo estándares exigentes para obras seguras, eficientes y duraderas.', null),
  ('home',   'cta.title',             'text', '¿Tiene un proyecto en mente?', null),
  -- Quiénes Somos
  ('about',  'hero.title',            'text', 'Quiénes Somos', null),
  ('about',  'hero.subtitle',         'text', 'Nuestra Trayectoria y Compromiso', null),
  ('about',  'historia.text',         'richtext', 'Somos un equipo de arquitectos, ingenieros y constructores que cree en hacer las cosas bien: desde la primera línea hasta la última entrega. Unimos conocimiento técnico, sensibilidad arquitectónica y ejecución rigurosa para crear obras que mejoran la vida de quienes las habitan.', null),
  ('about',  'timeline.item1.title',  'text', 'Fundación de Ingesocc SAS', null),
  ('about',  'timeline.item1.year',   'number', null, 2005),
  ('about',  'timeline.item2.title',  'text', 'Primer Gran Proyecto Industrial', null),
  ('about',  'timeline.item2.year',   'number', null, 2010),
  ('about',  'timeline.item3.title',  'text', 'Expansión de Capacidades', null),
  ('about',  'timeline.item3.year',   'number', null, 2015),
  ('about',  'timeline.item4.title',  'text', 'Consolidación como Líder del Sector', null),
  ('about',  'timeline.item4.year',   'number', null, 2022),
  ('about',  'mision.text',           'richtext', 'Convertir ideas en espacios de valor, uniendo conocimiento técnico, sensibilidad arquitectónica y ejecución rigurosa para crear obras que mejoran la vida de quienes las habitan.', null),
  ('about',  'vision.text',           'richtext', 'Ser reconocidos en Colombia como referentes en obras de infraestructura, industria y salud, destacando por la calidad, la seguridad y el compromiso con cada cliente.', null),
  ('about',  'valores.text',          'richtext', 'Compromiso, precisión, seguridad y transparencia en cada proyecto, desde la primera línea hasta la última entrega.', null),
  -- Equipo: nombres del maquetado, NO son el equipo real (plan 1.7 — reemplazar en Fase 9)
  ('about',  'equipo.member1.name',   'text', 'Juan Pérez', null),
  ('about',  'equipo.member1.role',   'text', 'Director de Proyectos', null),
  ('about',  'equipo.member2.name',   'text', 'María García', null),
  ('about',  'equipo.member2.role',   'text', 'Gerente de Obra', null),
  ('about',  'equipo.member3.name',   'text', 'Carlos Rodríguez', null),
  ('about',  'equipo.member3.role',   'text', 'Ingeniero Estructural', null),
  ('about',  'equipo.member4.name',   'text', 'Ana Martínez', null),
  ('about',  'equipo.member4.role',   'text', 'Arquitecta Líder', null),
  -- Contacto (datos de ejemplo del diseño actual — reemplazar por los reales, plan 1.6/1.7)
  ('contact','title',                 'text', 'Contacto', null),
  ('contact','subtitle',              'text', 'Cuéntenos sobre su proyecto y le responderemos a la brevedad.', null),
  ('contact','phone',                 'text', '+57 (604) 444 44 44', null),
  ('contact','email',                 'text', 'info@ingesocc.com', null),
  ('contact','address',               'text', 'Medellín, Colombia', null),
  ('contact','privacy_note',          'text', 'Tus datos serán tratados con confidencialidad.', null)
on conflict (page, section_key) do nothing;

-- Bloques de imagen: mismas URLs de Unsplash que los seeds estáticos. La app
-- resuelve value_image_path tal cual si ya es una URL completa (supabase.service).
insert into public.content_blocks (page, section_key, type, value_image_path) values
  ('home',   'hero.background_image', 'image', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80'),
  ('about',  'historia.image',        'image', 'https://images.unsplash.com/photo-1590579491624-f98f36d4c763?auto=format&fit=crop&w=1200&q=85'),
  ('about',  'equipo.member1.photo',  'image', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80'),
  ('about',  'equipo.member2.photo',  'image', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80'),
  ('about',  'equipo.member3.photo',  'image', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80'),
  ('about',  'equipo.member4.photo',  'image', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80')
on conflict (page, section_key) do nothing;

-- ----------------------------------------------------------------------------
-- Proyectos de ejemplo (sección 1.7 del plan)
-- OJO: son ilustrativos (referencia de estructura/formato), NO contenido a
-- publicar. El portafolio real se carga después vía el CRUD del panel admin.
-- ----------------------------------------------------------------------------
insert into public.projects (title, slug, description, price_min_wages, status, featured, sort_order) values
  ('Casa Ladera', 'casa-ladera',
   'Proyecto residencial unifamiliar de dos niveles con diseño contemporáneo, grandes ventanales y acabados de alta calidad, integrado a la topografía del lote.',
   180.00, 'published', true, 1),
  ('Distrito 48', 'distrito-48',
   'Edificio comercial de oficinas con fachada moderna en muro cortina, espacios flexibles y áreas comunes de alto estándar.',
   320.00, 'published', true, 2),
  ('Taller Norte', 'taller-norte',
   'Nave industrial en estructura metálica con cubierta liviana, amplios vanos libres y piso de alto tránsito para operación logística.',
   240.00, 'published', true, 3),
  ('Puente Metálico Veredal "El Progreso"', 'puente-metalico-veredal-el-progreso',
   'Puente vehicular en estructura metálica que conecta dos veredas, con luces de 24 m y barandas de seguridad certificadas.',
   350.00, 'published', false, 4),
  ('Bodega Estructural XYZ', 'bodega-estructural-xyz',
   'Bodega industrial de 2.400 m² con pórticos metálicos, cubierta en panel y sistema contra incendios.',
   250.00, 'published', false, 5),
  ('Torre de Oficinas Centro', 'torre-de-oficinas-centro',
   'Edificación de 8 niveles en concreto reforzado con fachada en muro cortina y dos sótanos de parqueadero.',
   480.00, 'published', false, 6),
  ('Centro de Salud Municipal', 'centro-de-salud-municipal',
   'Centro de salud de baja complejidad con áreas de urgencias, hospitalización y consulta externa, construido bajo estándares hospitalarios.',
   410.00, 'published', false, 7),
  ('Planta de Producción Andina', 'planta-de-produccion-andina',
   'Planta de producción con estructura metálica de gran luz, mezzanines de proceso y sistemas de ventilación industrial.',
   300.00, 'published', false, 8),
  ('Puente Peatonal Parque Lineal', 'puente-peatonal-parque-lineal',
   'Puente peatonal curvo en acero que articula el parque lineal con la zona comercial, con iluminación integrada.',
   90.00, 'published', false, 9),
  ('Conjunto Residencial Altos del Café', 'conjunto-residencial-altos-del-cafe',
   'Conjunto de vivienda multifamiliar con 3 torres, zonas verdes, piscina y urbanismo interior completo.',
   520.00, 'published', false, 10)
on conflict (slug) do nothing;

-- Asignación de categorías (slug del proyecto -> slug de categoría)
insert into public.project_categories (project_id, category_id)
select p.id, c.id
from (values
  ('casa-ladera',                           'edificaciones'),
  ('distrito-48',                           'edificaciones'),
  ('taller-norte',                          'estructuras-metalicas'),
  ('puente-metalico-veredal-el-progreso',   'puentes'),
  ('bodega-estructural-xyz',                'estructuras-metalicas'),
  ('torre-de-oficinas-centro',              'edificaciones'),
  ('centro-de-salud-municipal',             'proyectos-especiales'),
  ('planta-de-produccion-andina',           'estructuras-metalicas'),
  ('puente-peatonal-parque-lineal',         'puentes'),
  ('conjunto-residencial-altos-del-cafe',   'edificaciones')
) as mapping(project_slug, category_slug)
join public.projects p on p.slug = mapping.project_slug
join public.categories c on c.slug = mapping.category_slug
on conflict do nothing;

-- Imágenes de portada/galería: mismas URLs de Unsplash que los seeds estáticos
-- (projects.service.ts) para que el sitio se vea igual con la DB aplicada que
-- sin ella (plan 1.7/§22). El admin puede reemplazarlas desde el panel.
-- storage_path guarda la URL completa; resolvePublicUrl la devuelve tal cual.
-- NOT EXISTS: sin él, re-ejecutar el seed duplicaría filas (project_images no
-- tiene clave natural única; el guard por proyecto mantiene la idempotencia).
insert into public.project_images (project_id, storage_path, is_cover, sort_order)
select p.id, img.storage_path, img.is_cover, img.sort_order
from (values
  ('casa-ladera', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85', true, 0),
  ('casa-ladera', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85', false, 1),
  ('distrito-48', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85', true, 0),
  ('taller-norte', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=85', true, 0),
  ('puente-metalico-veredal-el-progreso', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=85', true, 0),
  ('puente-metalico-veredal-el-progreso', 'https://images.unsplash.com/photo-1504307651254-35680f583dfb?auto=format&fit=crop&w=1400&q=85', false, 1),
  ('bodega-estructural-xyz', 'https://images.unsplash.com/photo-1567958451986-2de427a4a0be?auto=format&fit=crop&w=1400&q=85', true, 0),
  ('bodega-estructural-xyz', 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1400&q=85', false, 1),
  ('torre-de-oficinas-centro', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1400&q=85', true, 0),
  ('torre-de-oficinas-centro', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85', false, 1),
  ('centro-de-salud-municipal', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=85', true, 0),
  ('centro-de-salud-municipal', 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1400&q=85', false, 1),
  ('planta-de-produccion-andina', 'https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?auto=format&fit=crop&w=1400&q=85', true, 0),
  ('planta-de-produccion-andina', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1400&q=85', false, 1),
  ('puente-peatonal-parque-lineal', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=85', true, 0),
  ('conjunto-residencial-altos-del-cafe', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=85', true, 0),
  ('conjunto-residencial-altos-del-cafe', 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=85', false, 1)
) as img(project_slug, storage_path, is_cover, sort_order)
join public.projects p on p.slug = img.project_slug
where not exists (
  select 1 from public.project_images pi where pi.project_id = p.id
);