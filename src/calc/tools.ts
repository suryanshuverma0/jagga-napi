import type { Decimal } from '@/math/decimal';
import { divideArea, equalRatios, parseRatios, type DivisionError, type Division } from '@/math/divide';
import { parseNonNegative } from '@/math/parse';
import { ratePerUnit, totalPrice } from '@/math/price';
import type { DividePayload, PricePayload } from '@/storage/types';
import { evaluateAreaEntry, type AreaEntryResult } from '@/units/areaEntry';

export type PriceEvaluation =
  | { status: 'incomplete'; area: AreaEntryResult }
  | { status: 'areaZero'; area: AreaEntryResult }
  | { status: 'invalidNumber'; error: 'negative' | 'invalid'; area: AreaEntryResult }
  | { status: 'ok'; mode: 'total' | 'rate'; amount: Decimal; areaSqft: Decimal; area: AreaEntryResult };

/** Total = rate × area, or (reverse mode) rate = total ÷ area. */
export function evaluatePrice(p: PricePayload): PriceEvaluation {
  const area = evaluateAreaEntry(p.area);
  if (area.status !== 'ok') return { status: 'incomplete', area };
  const text = p.mode === 'total' ? p.rate : p.total;
  const n = parseNonNegative(text);
  if (!n.ok) {
    return n.error === 'empty'
      ? { status: 'incomplete', area }
      : { status: 'invalidNumber', error: n.error, area };
  }
  if (p.mode === 'total') {
    return {
      status: 'ok',
      mode: 'total',
      amount: totalPrice(area.sqft, n.value, p.rateUnit),
      areaSqft: area.sqft,
      area,
    };
  }
  const rate = ratePerUnit(area.sqft, n.value, p.rateUnit);
  if (!rate) return { status: 'areaZero', area };
  return { status: 'ok', mode: 'rate', amount: rate, areaSqft: area.sqft, area };
}

export type DivideEvaluation =
  | { status: 'incomplete'; area: AreaEntryResult }
  | { status: 'countError' }
  | { status: 'ratioError' }
  | { status: 'divisionError'; error: DivisionError }
  | { status: 'ok'; division: Division; ratios: Decimal[]; area: AreaEntryResult };

export function evaluateDivide(p: DividePayload): DivideEvaluation {
  const area = evaluateAreaEntry(p.area);
  if (area.status !== 'ok') return { status: 'incomplete', area };

  let ratios: Decimal[];
  if (p.mode === 'equal') {
    if (p.count.trim() === '') return { status: 'incomplete', area };
    const n = parseNonNegative(p.count);
    if (!n.ok || !n.value.isInteger()) return { status: 'countError' };
    ratios = equalRatios(n.value.toNumber());
  } else {
    const r = parseRatios(p.ratios);
    if (!r.ok) return r.error === 'empty' ? { status: 'incomplete', area } : { status: 'ratioError' };
    ratios = r.ratios;
  }
  const res = divideArea(area.sqft, ratios, p.system);
  if (!res.ok) return { status: 'divisionError', error: res.error };
  return { status: 'ok', division: res.value, ratios, area };
}
