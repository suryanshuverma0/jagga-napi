import { fromSqft } from '@/units/conversions';
import { Decimal, type DecimalInput } from './decimal';

/** Units a land rate is quoted in. */
export type RateUnit = 'aana' | 'ropani' | 'dhur' | 'kattha' | 'sqft';

export const RATE_UNITS: readonly RateUnit[] = ['aana', 'ropani', 'dhur', 'kattha', 'sqft'];

/** Total price = (area expressed in the rate's unit) × rate. */
export function totalPrice(areaSqft: DecimalInput, ratePerUnit: DecimalInput, unit: RateUnit): Decimal {
  return fromSqft(areaSqft, unit).times(ratePerUnit);
}

/** Rate per unit = total ÷ (area in that unit). Null when the area is zero. */
export function ratePerUnit(areaSqft: DecimalInput, total: DecimalInput, unit: RateUnit): Decimal | null {
  const area = fromSqft(areaSqft, unit);
  if (area.isZero()) return null;
  return new Decimal(total).div(area);
}
