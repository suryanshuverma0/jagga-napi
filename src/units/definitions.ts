/**
 * Nepal land-area units, each defined exactly in square feet.
 *
 * Sources:
 * - Ropani and Bigha systems: the product specification (brief §3, mirrored in docs/PLAN.md), which
 *   states the traditional Nepali definitions as squares of a side length:
 *   ropani = 74 ft × 74 ft, aana = 18.5 ft × 18.5 ft, dhur = 13.5 ft × 13.5 ft, with
 *   16 aana/ropani, 4 paisa/aana, 4 daam/paisa, 20 dhur/kattha, 20 kattha/bigha.
 *   The figures are internally consistent (74 = 4 × 18.5; 20 × 20 × 182.25 = 72,900).
 * - 1 ft = 0.3048 m exactly (International Yard and Pound Agreement, 1959),
 *   so 1 sq ft = 0.09290304 m² exactly.
 * - 1 hectare = 10,000 m² (SI). 1 acre = 43,560 sq ft (statute acre).
 *
 * Square metres and hectares are derived from square feet, never the other way round,
 * so every Nepali unit stays an exact terminating decimal.
 */
import { Decimal } from '@/math/decimal';

export type AreaUnit =
  'ropani' | 'aana' | 'paisa' | 'daam' | 'bigha' | 'kattha' | 'dhur' | 'sqft' | 'sqm' | 'acre' | 'hectare';

export const AREA_UNITS: readonly AreaUnit[] = [
  'ropani',
  'aana',
  'paisa',
  'daam',
  'bigha',
  'kattha',
  'dhur',
  'sqft',
  'sqm',
  'acre',
  'hectare',
];

/** 1 sq ft in m² — exact, because 1 ft = 0.3048 m exactly. */
export const SQM_PER_SQFT = new Decimal('0.09290304');

/** 1 aana = 18.5 ft × 18.5 ft. */
const AANA_SQFT = new Decimal('342.25');
/** 1 dhur = 13.5 ft × 13.5 ft. */
const DHUR_SQFT = new Decimal('182.25');

/**
 * Square feet in one of each unit, for units with an exact square-foot value.
 * Metric units are handled via SQM_PER_SQFT in conversions.ts so that we divide
 * by the exact factor instead of multiplying by a rounded reciprocal.
 */
export const SQFT_PER_UNIT = {
  /** 1 daam = 1/4 paisa = 21.390625 sq ft. */
  daam: AANA_SQFT.div(16),
  /** 1 paisa = 1/4 aana = 85.5625 sq ft. */
  paisa: AANA_SQFT.div(4),
  /** 1 aana = 342.25 sq ft (18.5 ft × 18.5 ft). */
  aana: AANA_SQFT,
  /** 1 ropani = 16 aana = 5,476 sq ft (74 ft × 74 ft). */
  ropani: AANA_SQFT.times(16),
  /** 1 dhur = 182.25 sq ft (13.5 ft × 13.5 ft). */
  dhur: DHUR_SQFT,
  /** 1 kattha = 20 dhur = 3,645 sq ft. */
  kattha: DHUR_SQFT.times(20),
  /** 1 bigha = 20 kattha = 72,900 sq ft. */
  bigha: DHUR_SQFT.times(400),
  /** Base unit. */
  sqft: new Decimal(1),
  /** 1 acre = 43,560 sq ft (statute acre). */
  acre: new Decimal(43560),
} as const;

/** 1 hectare = 10,000 m² (SI). */
export const SQM_PER_HECTARE = new Decimal(10000);

/** Ropani-system sub-units per parent. */
export const AANA_PER_ROPANI = 16;
export const PAISA_PER_AANA = 4;
export const DAAM_PER_PAISA = 4;
export const DAAM_PER_ROPANI = AANA_PER_ROPANI * PAISA_PER_AANA * DAAM_PER_PAISA; // 256
export const DAAM_PER_AANA = PAISA_PER_AANA * DAAM_PER_PAISA; // 16

/** Bigha-system sub-units per parent. */
export const KATTHA_PER_BIGHA = 20;
export const DHUR_PER_KATTHA = 20;
export const DHUR_PER_BIGHA = KATTHA_PER_BIGHA * DHUR_PER_KATTHA; // 400
