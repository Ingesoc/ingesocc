-- ============================================================================
-- Ingesocc SAS — 0008: contacto corporativo real en content_blocks
-- Depende de las migraciones iniciales (tabla content_blocks).
--
-- Reemplaza los placeholders de contacto de `content_blocks` por los datos
-- reales de la empresa y agrega el bloque `contact.whatsapp` (CTA wa.me).
--
-- FUENTES DE LOS DATOS (no se inventa nada)
-- * src/constants/project.ts de Ingesoc/VentaDeLotes:
--     INGESOCC SAS · +57 312 737 0811 · gerencia.ingesocc@gmail.com
--     Oficina: Armenia – km 6 vía La Tebaida, Bodega 2
--     WhatsApp: 573127370811
--
-- NOTA: `content_blocks` es la fuente de verdad del CMS; el panel
-- /admin/contenido sigue pudiendo editar estos valores. La migración solo
-- corrige el estado inicial (los update llevan WHERE contra el placeholder
-- exacto: no sobrescriben ediciones previas del admin).
-- Idempotente: upserts con ON CONFLICT / WHERE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Contacto corporativo real (reemplaza placeholders de ejemplo)
-- ----------------------------------------------------------------------------
update public.content_blocks
   set value_text = '+57 312 737 0811', updated_at = now()
 where page = 'contact' and section_key = 'phone'
   and value_text = '+57 (604) 444 44 44';

update public.content_blocks
   set value_text = 'gerencia.ingesocc@gmail.com', updated_at = now()
 where page = 'contact' and section_key = 'email'
   and value_text = 'info@ingesocc.com';

update public.content_blocks
   set value_text = 'Armenia – km 6 vía La Tebaida, Bodega 2', updated_at = now()
 where page = 'contact' and section_key = 'address'
   and value_text = 'Medellín, Colombia';

-- CTA de WhatsApp (la página /contacto lo muestra como "Escríbenos por
-- WhatsApp"); si el bloque no existía, se crea.
insert into public.content_blocks (page, section_key, type, value_text)
values ('contact', 'whatsapp', 'text', 'https://wa.me/573127370811')
on conflict (page, section_key) do nothing;
