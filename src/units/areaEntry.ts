import { Decimal } from '@/math/decimal';
import { parseNonNegative, type NumberParseError } from '@/math/parse';
import { COMPOUND_UNITS, compoundToSqft, parseCompoundText, type CompoundSystem } from './compound';
import { toSqft } from './conversions';

/** Systems a user can type an area in. */
export type InputSystem = 'ropani' | 'bigha' | 'sqft' | 'sqm' | 'acre' | 'hectare';
export const INPUT_SYSTEMS: readonly InputSystem[] = ['ropani', 'bigha', 'sqft', 'sqm', 'acre', 'hectare'];

export function isCompoundSystem(s: InputSystem): s is CompoundSystem {
  return s === 'ropani' || s === 'bigha';
}

/** Raw, serialisable form of an area input exactly as typed (kept as text so history can restore it). */
export interface AreaEntry {
  system: InputSystem;
  /** Compound systems only: separate fields or a single "2-5-3-1" text. */
  mode: 'fields' | 'quick';
  /** One string per part for compound systems; a single string for simple systems. */
  fields: string[];
  quick: string;
}

export function emptyAreaEntry(system: InputSystem): AreaEntry {
  return {
    system,
    mode: 'fields',
    fields: fieldCount(system) === 1 ? [''] : blank(fieldCount(system)),
    quick: '',
  };
}

export function fieldCount(system: InputSystem): number {
  return isCompoundSystem(system) ? COMPOUND_UNITS[system].length : 1;
}

function blank(n: number): string[] {
  return Array.from({ length: n }, () => '');
}

export type AreaEntryError = NumberParseError | 'tooManyParts';

export type AreaEntryResult =
  | { status: 'empty' }
  | { status: 'error'; error: AreaEntryError; field?: number }
  | { status: 'ok'; sqft: Decimal };

/**
 * Evaluate an entry. Blank fields count as zero, but an entry with every field blank is "empty"
 * (no result shown yet) rather than zero.
 */
export function evaluateAreaEntry(entry: AreaEntry): AreaEntryResult {
  const { system } = entry;
  if (isCompoundSystem(system)) {
    if (entry.mode === 'quick') {
      const r = parseCompoundText(entry.quick, system);
      if (!r.ok) return r.error === 'empty' ? { status: 'empty' } : { status: 'error', error: r.error };
      return { status: 'ok', sqft: compoundToSqft(r.parts, system) };
    }
    const count = COMPOUND_UNITS[system].length;
    const parts: Decimal[] = [];
    let anyFilled = false;
    for (let i = 0; i < count; i++) {
      const text = entry.fields[i] ?? '';
      if (text.trim() === '') {
        parts.push(new Decimal(0));
        continue;
      }
      anyFilled = true;
      const r = parseNonNegative(text);
      if (!r.ok) return { status: 'error', error: r.error, field: i };
      parts.push(r.value);
    }
    if (!anyFilled) return { status: 'empty' };
    return { status: 'ok', sqft: compoundToSqft(parts, system) };
  }
  const text = entry.fields[0] ?? '';
  const r = parseNonNegative(text);
  if (!r.ok) return r.error === 'empty' ? { status: 'empty' } : { status: 'error', error: r.error, field: 0 };
  return { status: 'ok', sqft: toSqft(r.value, system) };
}

export function isAreaEntryBlank(entry: AreaEntry): boolean {
  return entry.fields.every((f) => f.trim() === '') && entry.quick.trim() === '';
}
