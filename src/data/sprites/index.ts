/** Registry of vector sprite definitions, keyed by unit id. */
import type { SpriteDef } from './types';
import { IQ_T55 } from './iq_t55';

export const SPRITES: SpriteDef[] = [IQ_T55];
export const SPRITE_BY_ID: Record<string, SpriteDef> = Object.fromEntries(SPRITES.map((s) => [s.id, s]));
