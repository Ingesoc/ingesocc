import { requireAdmin } from '../_lib/auth';
import {
  cloudinaryEndpoint,
  cloudinarySignature,
  isAllowedPublicId,
  readCloudinaryConfig,
} from '../_lib/cloudinary';
import {
  fail,
  failUnexpected,
  readJson,
  requirePost,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/http';

/**
 * POST /api/cloudinary/destroy
 *
 * Elimina (`image/destroy`) un asset de Cloudinary. El navegador NUNCA habla
 * con la API de Cloudinary para borrar: pide la firma aquí y esta función
 * ejecuta la llamada autenticada, con el API secret siempre en el servidor.
 *
 * Body: `{ publicId: 'ingesocc/projects/<uuid>/<uuid>' }`
 *
 * El `publicId` se valida contra el patrón del árbol de carpetas: un usuario
 * admin no puede borrar un asset ajeno al sitio ni salirse de `ingesocc/`.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!requirePost(req, res)) {
    return;
  }

  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  const body = readJson(req);
  const publicId = body['publicId'];

  if (!isAllowedPublicId(publicId)) {
    fail(res, 400, 'invalid_request', 'El asset indicado no es válido.');
    return;
  }

  let config;
  try {
    config = readCloudinaryConfig();
  } catch (error) {
    console.error('[api/cloudinary/destroy]', error);
    fail(res, 503, 'not_configured', 'El servicio de imágenes no está disponible en este momento.');
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinarySignature({ public_id: publicId, timestamp }, config.apiSecret);

  try {
    const response = await fetch(cloudinaryEndpoint(config.cloudName, 'image') + '/destroy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId, timestamp, signature }),
    });

    if (!response.ok) {
      // El detalle va al log; al admin solo se le da un mensaje accionable.
      console.error(
        `[api/cloudinary/destroy] Cloudinary respondió ${response.status}:`,
        await response.text().catch(() => ''),
      );
      fail(res, 502, 'upstream_error', 'No se pudo eliminar la imagen. Intenta de nuevo.');
      return;
    }

    const payload = (await response.json().catch(() => null)) as { result?: unknown } | null;
    console.log(
      `[api/cloudinary/destroy] ${admin.id} → ${publicId} (${String(payload?.result ?? 'ok')})`,
    );
    sendJson(res, 200, { publicId, result: typeof payload?.result === 'string' ? payload.result : 'ok' });
  } catch (error) {
    failUnexpected(res, 'cloudinary/destroy', error, 502);
  }
}
