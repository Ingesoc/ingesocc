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
-- ----------------------------------------------------------------------------
insert into public.services (name, slug, description, icon_name, status, sort_order) values
  ('Proyectos de Infraestructura', 'proyectos-de-infraestructura',
   'Desarrollamos puentes, obras civiles y grandes estructuras que conectan comunidades y fomentan el progreso',
   'building-2', 'published', 1),
  ('Proyectos Hospitalarios', 'proyectos-hospitalarios',
   'Construcción especializada de centros de salud, cumpliendo con los más altos estándares de calidad y funcionalidad',
   'heart-pulse', 'published', 2),
  ('Proyectos Industriales', 'proyectos-industriales',
   'Fabricamos e instalamos naves industriales, plantas de producción y bodegas optimizadas para la eficiencia operativa',
   'factory', 'published', 3),
  ('Consultoría y Diseño', 'consultoria-y-diseno',
   'Acompañamos desde la conceptualización, ofreciendo diseños innovadores y viables que optimizan recursos y garantizan resultados',
   'ruler', 'published', 4),
  ('Fabricación Metálica', 'fabricacion-metalica',
   'Especialistas en la fabricación a medida de estructuras metálicas de alta precisión para cualquier tipo de proyecto',
   'frame', 'published', 5),
  ('Proyectos de Vivienda', 'proyectos-de-vivienda',
   'Ejecutamos proyectos de vivienda unifamiliar y multifamiliar con diseños modernos y estructuras duraderas',
   'home', 'published', 6)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- content_blocks (sección 1.4 del plan — inventario completo por página)
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
  ('home',   'hero.background_image','image',  null, null),
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
  ('about',  'historia.image',        'image', null, null),
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
  ('about',  'equipo.member1.photo',  'image', null, null),
  ('about',  'equipo.member2.name',   'text', 'María García', null),
  ('about',  'equipo.member2.role',   'text', 'Gerente de Obra', null),
  ('about',  'equipo.member2.photo',  'image', null, null),
  ('about',  'equipo.member3.name',   'text', 'Carlos Rodríguez', null),
  ('about',  'equipo.member3.role',   'text', 'Ingeniero Estructural', null),
  ('about',  'equipo.member3.photo',  'image', null, null),
  ('about',  'equipo.member4.name',   'text', 'Ana Martínez', null),
  ('about',  'equipo.member4.role',   'text', 'Arquitecta Líder', null),
  ('about',  'equipo.member4.photo',  'image', null, null),
  -- Contacto (datos de ejemplo del diseño actual — reemplazar por los reales, plan 1.6/1.7)
  ('contact','title',                 'text', 'Contacto', null),
  ('contact','subtitle',              'text', 'Cuéntenos sobre su proyecto y le responderemos a la brevedad.', null),
  ('contact','phone',                 'text', '+57 (604) 444 44 44', null),
  ('contact','email',                 'text', 'info@ingesocc.com', null),
  ('contact','address',               'text', 'Medellín, Colombia', null),
  ('contact','privacy_note',          'text', 'Tus datos serán tratados con confidencialidad.', null)
on conflict (page, section_key) do nothing;

-- ----------------------------------------------------------------------------
-- Proyectos de ejemplo (sección 1.7 del plan)
-- OJO: son ilustrativos (referencia de estructura/formato), NO contenido a
-- publicar. El portafolio real se carga después vía el CRUD del panel admin.
-- Las imágenes se suben por el panel (project_images queda vacía aquí).
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