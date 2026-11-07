import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Polygon, Text as SvgText } from 'react-native-svg';

import { formatNumber } from '@/math/format';
import { quadrilateralVertices, triangleVertices, type Point } from '@/math/geometry';
import { useApp } from '@/state/AppState';
import type { PlotShape } from '@/storage/types';

const W = 320;
const H = 220;
const PAD = 30;

interface Props {
  shape: Exclude<PlotShape, 'triangles'>;
  /** Side lengths as plain numbers (already validated). */
  sides: number[];
  unitLabel: string;
  /** Static colours for the share card (it may render outside the themed tree). */
  colors?: { fill: string; stroke: string; text: string; accent: string };
}

function fit(points: Point[]): { pts: Point[]; scale: number } {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = Math.max(maxX - minX, 1e-9);
  const h = Math.max(maxY - minY, 1e-9);
  const scale = Math.min((W - 2 * PAD) / w, (H - 2 * PAD) / h);
  const offX = (W - w * scale) / 2;
  const offY = (H - h * scale) / 2;
  // Flip y so "up" in maths is up on screen.
  return {
    pts: points.map((p) => ({ x: offX + (p.x - minX) * scale, y: H - (offY + (p.y - minY) * scale) })),
    scale,
  };
}

/** A to-scale drawing of a rectangle, triangle or four-sided plot, with every side labelled. */
export function PlotPreview({ shape, sides, unitLabel, colors }: Props) {
  const { palette, tr } = useApp();
  const c = colors ?? {
    fill: palette.plotFill,
    stroke: palette.plotStroke,
    text: palette.text,
    accent: palette.accent,
  };

  let raw: Point[];
  let names: string[];
  let edgeLengths: number[];
  if (shape === 'rectangle') {
    const [l = 0, b = 0] = sides;
    raw = [
      { x: 0, y: 0 },
      { x: l, y: 0 },
      { x: l, y: b },
      { x: 0, y: b },
    ];
    names = [];
    edgeLengths = [l, b, l, b];
  } else if (shape === 'triangle') {
    const [a = 0, b = 0, cc = 0] = sides;
    raw = triangleVertices(a, b, cc);
    names = ['', '', ''];
    edgeLengths = [a, b, cc];
  } else {
    const [ab = 0, bc = 0, cd = 0, da = 0, ac = 0] = sides;
    raw = quadrilateralVertices(ab, bc, cd, da, ac);
    names = ['A', 'B', 'C', 'D'];
    edgeLengths = [ab, bc, cd, da];
  }
  const { pts } = fit(raw);
  const centroid = {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
  const label = (n: number) => tr.n(formatNumber(n, { maxDp: 2 }));

  const edges = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length] as Point;
    const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    // Push the label outward from the centroid.
    const dx = mid.x - centroid.x;
    const dy = mid.y - centroid.y;
    const len = Math.hypot(dx, dy) || 1;
    return {
      mid: { x: mid.x + (dx / len) * 14, y: mid.y + (dy / len) * 14 + 4 },
      length: edgeLengths[i] ?? 0,
    };
  });

  const a11y = `${tr.t('previewA11y')}: ${edgeLengths.map(label).join(', ')} ${unitLabel}`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Polygon
          points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={c.fill}
          stroke={c.stroke}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {shape === 'quadrilateral' ? (
          <Line
            x1={pts[0]!.x}
            y1={pts[0]!.y}
            x2={pts[2]!.x}
            y2={pts[2]!.y}
            stroke={c.accent}
            strokeWidth={2}
            strokeDasharray="6 5"
          />
        ) : null}
        {edges.map((e, i) =>
          shape === 'rectangle' && i > 1 ? null : (
            <SvgText
              key={`e${i}`}
              x={e.mid.x}
              y={e.mid.y}
              fill={c.text}
              fontSize={13}
              fontWeight="600"
              textAnchor="middle"
            >
              {label(e.length)}
            </SvgText>
          ),
        )}
        {names.map((n, i) => {
          if (!n) return null;
          const p = pts[i] as Point;
          const dx = p.x - centroid.x;
          const dy = p.y - centroid.y;
          const len = Math.hypot(dx, dy) || 1;
          return (
            <SvgText
              key={`v${i}`}
              x={p.x + (dx / len) * 14}
              y={p.y + (dy / len) * 14 + 4}
              fill={c.accent}
              fontSize={14}
              fontWeight="700"
              textAnchor="middle"
            >
              {n}
            </SvgText>
          );
        })}
        {shape === 'quadrilateral' ? (
          <SvgText
            x={(pts[0]!.x + pts[2]!.x) / 2}
            y={(pts[0]!.y + pts[2]!.y) / 2 - 6}
            fill={c.accent}
            fontSize={12}
            fontWeight="600"
            textAnchor="middle"
          >
            {label(sides[4] ?? 0)}
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}
