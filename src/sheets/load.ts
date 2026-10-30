/** Vehicle sheets bundled from data/vehicle_sheets/*.json (browser / Vite). Node tools read the files directly. */
import type { VehicleSheet } from './schema';

const files = import.meta.glob('../../data/vehicle_sheets/*.json', { eager: true, import: 'default' }) as Record<string, VehicleSheet>;

export const SHEETS: VehicleSheet[] = Object.keys(files).sort().map((k) => files[k]);
