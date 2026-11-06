import { Decimal } from '../decimal';
import {
  quadrilateralArea,
  quadrilateralVertices,
  rectangleArea,
  triangleArea,
  trianglesArea,
  triangleVertices,
} from '../geometry';

const area = (r: ReturnType<typeof triangleArea>) => (r.ok ? r.area : null);

describe('rectangleArea', () => {
  it('multiplies length and breadth exactly', () => {
    const r = rectangleArea('74', '74');
    expect(r.ok && r.area.toString()).toBe('5476');
    const r2 = rectangleArea('12.5', '0.4');
    expect(r2.ok && r2.area.toString()).toBe('5');
  });
  it('rejects zero and negative sides', () => {
    expect(rectangleArea(0, 5)).toEqual({ ok: false, error: 'nonPositive' });
    expect(rectangleArea(5, -1)).toEqual({ ok: false, error: 'nonPositive' });
  });
});

describe('triangleArea (stable Heron)', () => {
  it('3-4-5 right triangle has area 6 in any side order', () => {
    for (const [a, b, c] of [
      [3, 4, 5],
      [5, 3, 4],
      [4, 5, 3],
    ] as const) {
      expect(area(triangleArea(a, b, c))?.toString()).toBe('6');
    }
  });

  it('equilateral triangle of side 10 = 25√3', () => {
    const expected = new Decimal(3).sqrt().times(25);
    expect(
      area(triangleArea(10, 10, 10))
        ?.toDecimalPlaces(30)
        .eq(expected.toDecimalPlaces(30)),
    ).toBe(true);
  });

  it('is accurate for a needle-like triangle where naive Heron fails', () => {
    // Kahan's example: a = b = 100000, c = 1.00005 (area ≈ 50002.5).
    // Reference: c/4 · √(4a² − c²) for the isosceles case.
    const a = new Decimal(100000);
    const c = new Decimal('1.00005');
    const reference = c.div(4).times(a.pow(2).times(4).minus(c.pow(2)).sqrt());
    const got = area(triangleArea(a, a, c))!;
    expect(got.minus(reference).abs().lt('1e-25')).toBe(true);
  });

  it('handles very thin triangles near the inequality limit', () => {
    const got = area(triangleArea('100', '50', '50.000001'));
    expect(got).not.toBeNull();
    expect(got!.isPositive()).toBe(true);
    // s(s−a)(s−b)(s−c) ≈ 100 × 5e-7 × 50 × 50 = 0.125 → area ≈ 0.354
    expect(got!.toDecimalPlaces(3).toString()).toBe('0.354');
  });

  it('rejects a degenerate (flat) triangle', () => {
    expect(triangleArea(1, 2, 3)).toEqual({ ok: false, error: 'inequality' });
    expect(triangleArea(10, 5, 5)).toEqual({ ok: false, error: 'inequality' });
  });

  it('rejects sides that violate the triangle inequality', () => {
    expect(triangleArea(1, 2, 10)).toEqual({ ok: false, error: 'inequality' });
  });

  it('rejects zero or negative sides', () => {
    expect(triangleArea(0, 4, 5)).toEqual({ ok: false, error: 'nonPositive' });
    expect(triangleArea(3, -4, 5)).toEqual({ ok: false, error: 'nonPositive' });
  });

  it('handles very large plots (≈1,000 bigha)', () => {
    // Right triangle with legs 12,075 ft and 12,075 ft → 12,075² / 2 = 72,902,812.5 sq ft
    const hyp = new Decimal(12075).pow(2).times(2).sqrt();
    const got = area(triangleArea(12075, 12075, hyp))!;
    expect(got.toDecimalPlaces(6).toString()).toBe('72902812.5');
  });
});

describe('trianglesArea (irregular plots)', () => {
  it('sums triangles and returns each part', () => {
    const r = trianglesArea([
      [3, 4, 5],
      [6, 8, 10],
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.area.toString()).toBe('30');
      expect(r.parts.map(String)).toEqual(['6', '24']);
    }
  });

  it('names every bad triangle (1-based) and keeps the good parts', () => {
    const r = trianglesArea([
      [3, 4, 5],
      [1, 2, 10],
      [0, 1, 1],
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues).toEqual([
        { triangle: 2, error: 'inequality' },
        { triangle: 3, error: 'nonPositive' },
      ]);
      expect(r.parts[0]?.toString()).toBe('6');
      expect(r.parts[1]).toBeNull();
    }
  });

  it('an empty list is not a valid plot', () => {
    expect(trianglesArea([]).ok).toBe(false);
  });
});

describe('quadrilateralArea', () => {
  it('a 30×40 rectangle given as four sides + diagonal 50', () => {
    const r = quadrilateralArea({ a: 30, b: 40, c: 30, d: 40, diagonal: 50 });
    expect(r.ok && r.area.toString()).toBe('1200');
  });

  it('names the triangle that cannot close', () => {
    const r = quadrilateralArea({ a: 30, b: 40, c: 10, d: 10, diagonal: 50 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues).toEqual([{ triangle: 2, error: 'inequality' }]);
  });
});

describe('drawing vertices', () => {
  const dist = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y);

  it('triangleVertices reproduces the side lengths', () => {
    const [A, B, C] = triangleVertices(5, 4, 3);
    expect(dist(A, B)).toBeCloseTo(5);
    expect(dist(B, C)).toBeCloseTo(4);
    expect(dist(C, A)).toBeCloseTo(3);
  });

  it('quadrilateralVertices reproduces sides and diagonal, with B and D on opposite sides', () => {
    const [A, B, C, D] = quadrilateralVertices(30, 40, 30, 40, 50);
    expect(dist(A, B)).toBeCloseTo(30);
    expect(dist(B, C)).toBeCloseTo(40);
    expect(dist(C, D)).toBeCloseTo(30);
    expect(dist(D, A)).toBeCloseTo(40);
    expect(dist(A, C)).toBeCloseTo(50);
    expect(Math.sign(B.y)).toBe(-Math.sign(D.y));
  });
});
