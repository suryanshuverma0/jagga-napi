import { Decimal, ZERO, type DecimalInput } from './decimal';

export type ShapeError = 'nonPositive' | 'inequality';
export type AreaResult = { ok: true; area: Decimal } | { ok: false; error: ShapeError };

function allPositive(values: readonly Decimal[]): boolean {
  return values.every((v) => v.isPositive() && !v.isZero());
}

/** Rectangle area = length × breadth. */
export function rectangleArea(length: DecimalInput, breadth: DecimalInput): AreaResult {
  const l = new Decimal(length);
  const b = new Decimal(breadth);
  if (!allPositive([l, b])) return { ok: false, error: 'nonPositive' };
  return { ok: true, area: l.times(b) };
}

/**
 * Triangle area from three sides with the numerically stable form of Heron's formula
 * (W. Kahan, "Miscalculating Area and Angles of a Needle-like Triangle", 2014):
 *
 *   sort a ≥ b ≥ c, then
 *   A = ¼ · √((a + (b + c)) · (c − (a − b)) · (c + (a − b)) · (a + (b − c)))
 *
 * The brackets must be evaluated exactly as written. The triangle is valid only when
 * c − (a − b) > 0, i.e. the longest side is strictly shorter than the other two combined;
 * a flat (degenerate) triangle is rejected rather than reported as zero area.
 */
export function triangleArea(sideA: DecimalInput, sideB: DecimalInput, sideC: DecimalInput): AreaResult {
  const sides = [new Decimal(sideA), new Decimal(sideB), new Decimal(sideC)];
  if (!allPositive(sides)) return { ok: false, error: 'nonPositive' };
  sides.sort((x, y) => y.cmp(x));
  const [a, b, c] = sides as [Decimal, Decimal, Decimal];

  const t2 = c.minus(a.minus(b));
  if (t2.lte(ZERO)) return { ok: false, error: 'inequality' };

  const t1 = a.plus(b.plus(c));
  const t3 = c.plus(a.minus(b));
  const t4 = a.plus(b.minus(c));
  const area = t1.times(t2).times(t3).times(t4).sqrt().div(4);
  return { ok: true, area };
}

export type TriangleSides = readonly [DecimalInput, DecimalInput, DecimalInput];

export interface TriangleIssue {
  /** 1-based index of the triangle, as shown to the user. */
  triangle: number;
  error: ShapeError;
}

export type MultiAreaResult =
  | { ok: true; area: Decimal; parts: Decimal[] }
  | { ok: false; issues: TriangleIssue[]; parts: (Decimal | null)[] };

/** Sum of several triangles, each given by three sides — how plots are split on the ground. */
export function trianglesArea(triangles: readonly TriangleSides[]): MultiAreaResult {
  const results = triangles.map((t) => triangleArea(t[0], t[1], t[2]));
  const issues: TriangleIssue[] = [];
  results.forEach((r, i) => {
    if (!r.ok) issues.push({ triangle: i + 1, error: r.error });
  });
  const parts = results.map((r) => (r.ok ? r.area : null));
  if (issues.length > 0 || results.length === 0) return { ok: false, issues, parts };
  const okParts = parts as Decimal[];
  return { ok: true, area: okParts.reduce<Decimal>((acc, p) => acc.plus(p), ZERO), parts: okParts };
}

export interface QuadSides {
  /** A→B */
  a: DecimalInput;
  /** B→C */
  b: DecimalInput;
  /** C→D */
  c: DecimalInput;
  /** D→A */
  d: DecimalInput;
  /** Diagonal A→C */
  diagonal: DecimalInput;
}

/**
 * Quadrilateral ABCD from four sides and the diagonal AC: split into triangles
 * ABC (a, b, AC) and ACD (c, d, AC).
 */
export function quadrilateralArea(q: QuadSides): MultiAreaResult {
  return trianglesArea([
    [q.a, q.b, q.diagonal],
    [q.c, q.d, q.diagonal],
  ]);
}

// ---------------------------------------------------------------------------------------------
// Drawing helpers. These only position an SVG preview, so plain floating point is fine here.
// ---------------------------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

/** Third vertex P with |P−A| = ra and |P−B| = rb, for A = (0,0), B = (base,0); y ≥ 0. */
function apex(base: number, ra: number, rb: number): Point {
  const x = (base * base + ra * ra - rb * rb) / (2 * base);
  const y = Math.sqrt(Math.max(0, ra * ra - x * x));
  return { x, y };
}

/** Vertices of triangle with AB = a, BC = b, CA = c (A at the origin, B on the +x axis). */
export function triangleVertices(a: number, b: number, c: number): [Point, Point, Point] {
  const C = apex(a, c, b);
  return [{ x: 0, y: 0 }, { x: a, y: 0 }, C];
}

/**
 * Vertices of convex quadrilateral ABCD with AB = a, BC = b, CD = c, DA = d and diagonal AC.
 * A at the origin, C on the +x axis, B above the diagonal and D below it.
 */
export function quadrilateralVertices(
  a: number,
  b: number,
  c: number,
  d: number,
  diagonal: number,
): [Point, Point, Point, Point] {
  const B = apex(diagonal, a, b);
  const D = apex(diagonal, d, c);
  return [{ x: 0, y: 0 }, B, { x: diagonal, y: 0 }, { x: D.x, y: -D.y }];
}
