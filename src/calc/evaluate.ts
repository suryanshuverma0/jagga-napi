import { combineAreas } from '@/math/arithmetic';
import type { Decimal } from '@/math/decimal';
import {
  quadrilateralArea,
  rectangleArea,
  triangleArea,
  trianglesArea,
  type MultiAreaResult,
  type TriangleIssue,
} from '@/math/geometry';
import { parsePositive } from '@/math/parse';
import type { ArithPayload, CalcKind, PayloadByKind, PlotPayload, PlotShape } from '@/storage/types';
import { evaluateAreaEntry } from '@/units/areaEntry';
import { lengthAreaToSqft } from '@/units/conversions';

export type PlotEvaluation =
  | { status: 'incomplete' }
  /** `index` is the flat field index: sides[i], or triangle t side s → t * 3 + s. */
  | { status: 'invalidNumber'; index: number }
  | { status: 'rectError' }
  | { status: 'shapeError'; issues: TriangleIssue[]; parts: (Decimal | null)[] }
  | { status: 'ok'; sqft: Decimal; parts: Decimal[] };

export const SIDES_NEEDED: Record<Exclude<PlotShape, 'triangles'>, number> = {
  rectangle: 2,
  triangle: 3,
  quadrilateral: 5,
};

export function emptyPlot(lengthUnit: PlotPayload['lengthUnit']): PlotPayload {
  return { shape: 'rectangle', lengthUnit, sides: ['', '', '', '', ''], triangles: [['', '', '']] };
}

type SidesResult =
  { kind: 'values'; values: Decimal[] } | { kind: 'incomplete' } | { kind: 'invalid'; index: number };

function parseSides(values: readonly string[], count: number): SidesResult {
  const out: Decimal[] = [];
  for (let i = 0; i < count; i++) {
    const raw = values[i] ?? '';
    if (raw.trim() === '') return { kind: 'incomplete' };
    const r = parsePositive(raw);
    if (!r.ok) return { kind: 'invalid', index: i };
    out.push(r.value);
  }
  return { kind: 'values', values: out };
}

function fromMulti(res: MultiAreaResult, toSqft: (x: Decimal) => Decimal): PlotEvaluation {
  if (!res.ok)
    return { status: 'shapeError', issues: res.issues, parts: res.parts.map((p) => (p ? toSqft(p) : null)) };
  return { status: 'ok', sqft: toSqft(res.area), parts: res.parts.map(toSqft) };
}

/** Evaluate a plot payload into square feet. Recomputes as soon as every needed field is valid. */
export function evaluatePlot(p: PlotPayload): PlotEvaluation {
  const toSqft = (x: Decimal) => lengthAreaToSqft(x, p.lengthUnit);

  if (p.shape === 'triangles') {
    if (p.triangles.length === 0) return { status: 'incomplete' };
    // Invalid numbers win over incomplete fields so the user sees the problem immediately.
    const parsed: Decimal[][] = [];
    let incomplete = false;
    for (let t = 0; t < p.triangles.length; t++) {
      const r = parseSides(p.triangles[t] ?? [], 3);
      if (r.kind === 'invalid') return { status: 'invalidNumber', index: t * 3 + r.index };
      if (r.kind === 'incomplete') incomplete = true;
      else parsed.push(r.values);
    }
    if (incomplete) return { status: 'incomplete' };
    return fromMulti(trianglesArea(parsed.map((v) => [v[0]!, v[1]!, v[2]!] as const)), toSqft);
  }

  const r = parseSides(p.sides, SIDES_NEEDED[p.shape]);
  if (r.kind === 'invalid') return { status: 'invalidNumber', index: r.index };
  if (r.kind === 'incomplete') return { status: 'incomplete' };
  const [a, b, c, d, e] = r.values as [Decimal, Decimal, Decimal, Decimal, Decimal];

  if (p.shape === 'rectangle') {
    const rect = rectangleArea(a, b);
    return rect.ok
      ? { status: 'ok', sqft: toSqft(rect.area), parts: [toSqft(rect.area)] }
      : { status: 'rectError' };
  }
  if (p.shape === 'triangle') {
    const tri = triangleArea(a, b, c);
    if (!tri.ok) return { status: 'shapeError', issues: [{ triangle: 1, error: tri.error }], parts: [null] };
    return { status: 'ok', sqft: toSqft(tri.area), parts: [toSqft(tri.area)] };
  }
  return fromMulti(quadrilateralArea({ a, b, c, d, diagonal: e }), toSqft);
}

export function evaluateArith(p: ArithPayload): Decimal | null {
  const parcels: { sign: 1 | -1; sqft: Decimal }[] = [];
  for (const parcel of p.parcels) {
    const r = evaluateAreaEntry(parcel.area);
    if (r.status === 'error') return null;
    if (r.status === 'ok') parcels.push({ sign: parcel.sign, sqft: r.sqft });
  }
  return parcels.length === 0 ? null : combineAreas(parcels);
}

/** The headline area of any saved calculation, or null if its inputs are incomplete or invalid. */
export function evaluatePayloadArea<K extends CalcKind>(kind: K, payload: PayloadByKind[K]): Decimal | null {
  if (kind === 'plot') {
    const r = evaluatePlot(payload as PlotPayload);
    return r.status === 'ok' ? r.sqft : null;
  }
  if (kind === 'arith') return evaluateArith(payload as ArithPayload);
  const r = evaluateAreaEntry((payload as PayloadByKind['convert']).area);
  return r.status === 'ok' ? r.sqft : null;
}
