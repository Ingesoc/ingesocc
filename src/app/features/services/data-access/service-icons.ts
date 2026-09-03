import {
  LucideBuilding2,
  LucideFactory,
  LucideFrame,
  LucideHardHat,
  LucideHeartPulse,
  LucideHome,
  LucidePenTool,
  LucideRuler,
  LucideUsers,
  LucideWarehouse,
  type LucideIcon,
} from '@lucide/angular';

/** Registro icon_name -> componente lucide (regla foto vs. ícono del plan 1.3). */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  'building-2': LucideBuilding2,
  'heart-pulse': LucideHeartPulse,
  'factory': LucideFactory,
  'ruler': LucideRuler,
  'frame': LucideFrame,
  'home': LucideHome,
  'hard-hat': LucideHardHat,
  'warehouse': LucideWarehouse,
  'users': LucideUsers,
  'pen-tool': LucidePenTool,
};

/** Nombres disponibles para el selector del formulario admin. */
export const SERVICE_ICON_NAMES: readonly string[] = Object.keys(SERVICE_ICONS);

/** Devuelve el componente lucide para un icon_name, o null si no existe. */
export function serviceIconFor(name: string | null | undefined): LucideIcon | null {
  return name ? (SERVICE_ICONS[name] ?? null) : null;
}