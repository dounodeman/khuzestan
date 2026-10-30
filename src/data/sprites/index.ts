/** Registry of vector sprite definitions, keyed by unit id. Every sprite is generated from its vehicle sheet. */
import type { SpriteDef } from './types';
import { SHEETS } from '../../sheets/load';
import { generateSprite } from '../../sheets/generate';

export const SPRITES: SpriteDef[] = SHEETS.map(generateSprite);
export const SPRITE_BY_ID: Record<string, SpriteDef> = Object.fromEntries(SPRITES.map((s) => [s.id, s]));
