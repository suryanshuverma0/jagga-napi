import { Decimal } from '@/math/decimal';
import { formatNumber } from '@/math/format';
import { parseNonNegative, type NumberParseError } from '@/math/parse';
import {
  COMPOUND_UNITS,
  compoundToSqft,
  formatCompound,
  parseCompoundText,
  toCompound,
  type CompoundSystem,
} from './compound';
import { fromSqft, toSqft } from './conversions';

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

/**
 * Switch an entry to another system, carrying the current value across so the user does not
 * have to retype it. Compound systems keep 2 decimals on the last part, others up to 4 decimals;
 * an empty or invalid entry becomes an empty entry in the new system.
 */
export function reexpressEntry(entry: AreaEntry, system: InputSystem): AreaEntry {
  if (system === entry.system) return entry;
  const next = emptyAreaEntry(system);
  const r = evaluateAreaEntry(entry);
  if (r.status !== 'ok' || r.sqft.isZero()) return next;
  if (isCompoundSystem(system)) {
    const cv = toCompound(r.sqft, system);
    const last = cv.parts.length - 1;
    next.fields = cv.parts.map((p, i) => formatNumber(p, { maxDp: i === last ? 2 : 0, grouping: false }));
    return next;
  }
  next.fields = [formatNumber(fromSqft(r.sqft, system), { maxDp: 4, grouping: false })];
  return next;
}

/** Typed compound parts as decimals (blank = 0), or null if the entry is not a valid compound entry. */
function typedParts(entry: AreaEntry): Decimal[] | null {
  if (!isCompoundSystem(entry.system)) return null;
  if (entry.mode === 'quick') {
    const r = parseCompoundText(entry.quick, entry.system);
    return r.ok ? r.parts : null;
  }
  const parts: Decimal[] = [];
  for (const f of entry.fields) {
    if (f.trim() === '') {
      parts.push(new Decimal(0));
      continue;
    }
    const r = parseNonNegative(f);
    if (!r.ok) return null;
    parts.push(r.value);
  }
  return parts;
}

/**
 * If a compound entry is not already in normal form (e.g. "0-20-0-0" or "1.5-0-0-0"), return the
 * normalised text ("1-4-0-0", "1-8-0-0") so the UI can say how it was read. Otherwise null.
 */
export function normalisedCompoundText(entry: AreaEntry): string | null {
  if (!isCompoundSystem(entry.system)) return null;
  const typed = typedParts(entry);
  if (!typed) return null;
  const sqft = compoundToSqft(typed, entry.system);
  const cv = toCompound(sqft, entry.system);
  const same = cv.parts.every((p, i) => p.eq(typed[i] ?? 0));
  return same ? null : formatCompound(cv);
}

/** Switch between separate fields and quick entry, carrying the typed value across. */
export function toggleEntryMode(entry: AreaEntry): AreaEntry {
  if (!isCompoundSystem(entry.system)) return entry;
  if (entry.mode === 'fields') {
    const anyTyped = entry.fields.some((f) => f.trim() !== '');
    const quick = anyTyped ? entry.fields.map((f) => (f.trim() === '' ? '0' : f.trim())).join('-') : '';
    return { ...entry, mode: 'quick', quick };
  }
  const tokens = entry.quick.trim() === '' ? [] : entry.quick.trim().split(/\s*[-/]\s*|\s+/);
  const fields = Array.from({ length: fieldCount(entry.system) }, (_, i) => tokens[i] ?? '');
  return { ...entry, mode: 'fields', fields };
}

export function isAreaEntryBlank(entry: AreaEntry): boolean {
  return entry.fields.every((f) => f.trim() === '') && entry.quick.trim() === '';
}
