import { Decimal, type DecimalInput } from '@/math/decimal';
import { SQFT_PER_UNIT, SQM_PER_HECTARE, SQM_PER_SQFT, type AreaUnit } from './definitions';

/** Convert an amount of `unit` into square feet (the internal representation of every area). */
export function toSqft(value: DecimalInput, unit: AreaUnit): Decimal {
  const v = new Decimal(value);
  switch (unit) {
    case 'sqm':
      return v.div(SQM_PER_SQFT);
    case 'hectare':
      return v.times(SQM_PER_HECTARE).div(SQM_PER_SQFT);
    default:
      return v.times(SQFT_PER_UNIT[unit]);
  }
}

/** Convert square feet into an amount of `unit`. */
export function fromSqft(sqft: DecimalInput, unit: AreaUnit): Decimal {
  const v = new Decimal(sqft);
  switch (unit) {
    case 'sqm':
      return v.times(SQM_PER_SQFT);
    case 'hectare':
      return v.times(SQM_PER_SQFT).div(SQM_PER_HECTARE);
    default:
      return v.div(SQFT_PER_UNIT[unit]);
  }
}

export function convert(value: DecimalInput, from: AreaUnit, to: AreaUnit): Decimal {
  return from === to ? new Decimal(value) : fromSqft(toSqft(value, from), to);
}

/** Lengths entered on the plot calculator. */
export type LengthUnit = 'ft' | 'm';

/** Area in (length unit)² → square feet. */
export function lengthAreaToSqft(area: DecimalInput, unit: LengthUnit): Decimal {
  return unit === 'ft' ? new Decimal(area) : toSqft(area, 'sqm');
}

/** 1 m = 1 / 0.3048 ft exactly. */
export const FT_PER_M = new Decimal(1).div('0.3048');
