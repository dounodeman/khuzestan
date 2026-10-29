import type { LightPreset, WeatherPreset } from './types';

/**
 * Time-of-day presets for late September at about 31° N (docs/environment_research.md §1).
 * Dawn and dusk use the true sun direction (due east / due west). Noon deliberately uses the upper-left
 * convention instead of the true southern sun, because light from the bottom of a north-up map makes relief
 * read inside-out. Night is cold moonlight from the upper left.
 */
export const LIGHTING: LightPreset[] = [
  {
    id: 'dawn', name: 'Dawn', sunAzimuth: 92, sunElevation: 9,
    ambient: '#e6d3c6', tint: '#ffbf8a', tintAlpha: 0.22, saturation: 0.9,
    shadow: { color: '#3a3050', alpha: 0.42 }, sky: '#c9a99a', visibility: 0.75,
  },
  {
    id: 'noon', name: 'Noon', sunAzimuth: 315, sunElevation: 58,
    ambient: '#ffffff', tint: '#fff4d8', tintAlpha: 0.12, saturation: 0.92,
    shadow: { color: '#2e2616', alpha: 0.38 }, sky: '#b9c6cc', visibility: 1,
  },
  {
    id: 'dusk', name: 'Dusk', sunAzimuth: 270, sunElevation: 7,
    ambient: '#e2c8b0', tint: '#ffa866', tintAlpha: 0.24, saturation: 0.95,
    shadow: { color: '#3b2638', alpha: 0.45 }, sky: '#c78c6a', visibility: 0.7,
  },
  {
    id: 'night', name: 'Night', sunAzimuth: 300, sunElevation: 40,
    ambient: '#5d6a86', tint: '#7d9ccc', tintAlpha: 0.28, saturation: 0.4,
    shadow: { color: '#05070d', alpha: 0.35 }, sky: '#1d2536', visibility: 0.35,
  },
];

export const WEATHER: WeatherPreset[] = [
  { id: 'clear', name: 'Clear', veil: '#ffffff', veilAlpha: 0, sheets: 0, shadowMul: 1, visibility: 1, windSpeed: 3 },
  { id: 'haze', name: 'Heat haze', veil: '#d9cfb8', veilAlpha: 0.16, sheets: 0, shadowMul: 0.85, visibility: 0.8, windSpeed: 2 },
  // Shamal: north-westerly dust storm (verify direction, §1).
  { id: 'dust', name: 'Dust storm (shamal)', veil: '#c4a679', veilAlpha: 0.42, sheets: 0.55, shadowMul: 0.35, visibility: 0.35, windSpeed: 12 },
];

/** Prevailing wind blows FROM this bearing (degrees clockwise from north); westerly in September (§1). */
export const WIND_FROM_DEG = 290;
