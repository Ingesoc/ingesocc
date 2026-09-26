import { requireAdmin } from '../_lib/auth';
import {
  buildFolder,
  cloudinarySignature,
  isValidSegment,
  newAssetId,
  normalizeFolder,
  readCloudinaryConfig,
} from '../_lib/cloudinary';
import {
  fail,
  readJson,
  requirePost,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/http';

/** Payload que el navegador necesita para hacer el upload firmado. */
interface SignatureResponse {
  timestamp: number;
  signature: string;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId: string;
}

/**
 * POST /api/cloudinary/signature
 *
 * Entrega al admin autenticado una firma de un solo uso para un upload directo
 * del navegador a Cloudinary. El API secret NUNCA sale de este servidor: solo
 * se usa aquí, dentro de la función, para calcular el SHA-1.
 *
 * Body: `{ folder: 'projects'|'services'|'content'|'team'|'general', entityId?: string }`
 *
 * El cliente no elige el `public_id` (se genera un UUID en el servidor) ni puede
 * pedir una carpeta arbitraria: la carpeta se valida contra lista blanca.
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

  const folder = normalizeFolder(body['folder']);
  if (!folder) {
    fail(
      res,
      400,
      'invalid_request',
      'La carpeta de destino no es válida. Recarga la página e inténtalo de nuevo.',
    );
    return;
  }

  const entityId = body['entityId'];
  if (entityId != null && !isValidSegment(entityId)) {
    fail(res, 400, 'invalid_request', 'El identificador del recurso no es válido.');
    return;
  }

  let config;
  try {
    config = readCloudinaryConfig();
  } catch (error) {
    console.error('[api/cloudinary/signature]', error);
    fail(res, 503, 'not_configured', 'El servicio de imágenes no está disponible en este momento.');
    return;
  }

  const targetFolder = buildFolder(folder, entityId);
  // Nombre determinista dentro de la carpeta: UUID, nunca el nombre del archivo
  // que subió el usuario (espacios, acentos, acentos graves y colisiones).
  const publicId = newAssetId();
  const timestamp = Math.floor(Date.now() / 1000);

  const response: SignatureResponse = {
    timestamp,
    signature: cloudinarySignature(
      { folder: targetFolder, public_id: publicId, timestamp },
      config.apiSecret,
    ),
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder: targetFolder,
    publicId,
  };

  console.log(`[api/cloudinary/signature] firma emitida para ${admin.id} → ${targetFolder}`);
  sendJson(res, 200, response);
}

