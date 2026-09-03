import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(process.cwd(), 'src/environments/environment.ts'), 'utf8');
const url = source.match(/supabaseUrl:\s*'([^']+)'/)?.[1] ?? '';
const anonKey = source.match(/supabaseAnonKey:\s*'([^']+)'/)?.[1] ?? '';
const email = process.env.E2E_ADMIN_EMAIL ?? '';
const password = process.env.E2E_ADMIN_PASSWORD ?? '';

const anon = createClient(url, anonKey);
const { data: session } = await anon.auth.signInWithPassword({ email, password });
if (!session?.session) {
  console.log('sign-in falló');
  process.exit(1);
}
const jwt = session.session.access_token;
console.log('Sesión admin OK');

// Buckets con el JWT autenticado
const r = await fetch(`${url}/storage/v1/bucket`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${jwt}` },
});
const buckets = await r.json();
console.log('Buckets (admin JWT):', Array.isArray(buckets) ? (buckets.length ? buckets.map((b) => b.id).join(', ') : '(ninguno)') : JSON.stringify(buckets).slice(0, 200));

// ¿Puede el admin leer cada tabla vía PostgREST? (prueba el caché con el rol admin)
for (const table of ['profiles', 'content_blocks', 'projects', 'services', 'categories', 'contact_messages', 'project_categories', 'project_images']) {
  const { data, error } = await anon.from(table).select('*').limit(1);
  console.log(`${table}: ${error ? `ERROR ${error.code} ${error.message}` : `OK (${Array.isArray(data) ? data.length : 0} filas en límite 1)`}`);
}

// ¿Existe el trigger / función? Intentar ver el perfil del propio usuario
const { data: me, error: meErr } = await anon.from('profiles').select('email, role').eq('id', session.session.user.id).maybeSingle();
console.log('Mi perfil:', meErr ? `ERROR ${meErr.code} ${meErr.message}` : JSON.stringify(me));
