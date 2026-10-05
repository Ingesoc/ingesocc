-- ============================================================================
-- Ingesocc SAS — 0009: proyecto La Holanda (datos)
-- Depende de 20260918000001 (columna projects.external_url) y de las categorías
-- del seed (supabase/seed.sql, 'proyectos-especiales').
--
-- Inserta el proyecto La Holanda (publicada + destacada) como instancia del
-- modelo existente `projects` — NO se crean tablas nuevas — con su portada
-- oficial (og:image del micrositio, Cloudinary de la empresa) y la categoría
-- existente "Proyectos Especiales".
--
-- FUENTES DE LOS DATOS (no se inventa nada)
-- * Micrositio oficial: https://laholanda.ingesocc.com/
-- * src/constants/project.ts de Ingesoc/VentaDeLotes
--
-- Guardas de idempotencia: `where not exists` — no se toca si ya existe (el
-- admin pudo editarlo); categoría y portada solo se vinculan si faltan.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Proyecto La Holanda (instancia del modelo existente, NO una tabla nueva)
--
-- Guardas de idempotencia:
-- * `where not exists`: no se toca si ya existe (el admin pudo editarlo).
-- * Categoría y portada solo se vinculan si el proyecto aún no las tiene.
-- ----------------------------------------------------------------------------
insert into public.projects (title, slug, description, status, featured, sort_order, external_url)
select 'La Holanda',
       'la-holanda',
       'Parcelación campestre desarrollada por Ingesocc S.A.S. en Quimbaya, Quindío: un proyecto de inversión, valorización y calidad de vida en la vía Quimbaya - Alcalá, vereda Jazmín. Conoce el micrositio oficial con toda la información de lotes y disponibilidad.',
       'published',
       true,
       0,
       'https://laholanda.ingesocc.com/'
where not exists (select 1 from public.projects where slug = 'la-holanda');

-- Categoría existente "Proyectos Especiales" (sin crear categorías nuevas).
insert into public.project_categories (project_id, category_id)
select p.id, c.id
from public.projects p
join public.categories c on c.slug = 'proyectos-especiales'
where p.slug = 'la-holanda'
  and not exists (
    select 1 from public.project_categories pc
    where pc.project_id = p.id and pc.category_id = c.id
  );

-- Portada oficial (og:image del micrositio; resolvePublicUrl la devuelve tal
-- cual por ser URL completa). Solo si el proyecto aún no tiene imágenes.
insert into public.project_images (project_id, storage_path, is_cover, sort_order)
select p.id,
       'https://res.cloudinary.com/j5a9xyaq/image/upload/v1784303937/laholanda/landscapes/DJI_0131.webp',
       true,
       0
from public.projects p
where p.slug = 'la-holanda'
  and not exists (select 1 from public.project_images pi where pi.project_id = p.id);
