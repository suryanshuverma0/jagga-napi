import type { Language } from '@/i18n';
import type { NumeralScript } from '@/math/numerals';
import type { RateUnit } from '@/math/price';
import type { AreaEntry, InputSystem } from '@/units/areaEntry';
import type { CompoundSystem } from '@/units/compound';
import type { LengthUnit } from '@/units/conversions';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  language: Language;
  numerals: NumeralScript;
  defaultSystem: CompoundSystem;
  defaultLengthUnit: LengthUnit;
  theme: ThemePreference;
}

export interface AppMeta {
  onboarded: boolean;
  /** Incremented on every cold start. 1 = first session. */
  sessionCount: number;
  /** Epoch ms of the last interstitial shown. */
  lastInterstitialAt: number;
  /** Number of saves + shares, for the review prompt. */
  engagementCount: number;
  /** Epoch ms of the last in-app review request (0 = never). */
  lastReviewPromptAt: number;
  lastInputSystem: InputSystem | null;
  lastLengthUnit: LengthUnit | null;
}

export type CalcKind = 'convert' | 'plot' | 'price' | 'divide' | 'arith';
export const CALC_KINDS: readonly CalcKind[] = ['convert', 'plot', 'price', 'divide', 'arith'];

export type PlotShape = 'rectangle' | 'triangle' | 'quadrilateral' | 'triangles';
export const PLOT_SHAPES: readonly PlotShape[] = ['rectangle', 'triangle', 'quadrilateral', 'triangles'];

export interface ConvertPayload {
  area: AreaEntry;
}

export interface PlotPayload {
  shape: PlotShape;
  lengthUnit: LengthUnit;
  /** rectangle: [l, b]; triangle: [a, b, c]; quadrilateral: [ab, bc, cd, da, ac] */
  sides: string[];
  /** irregular plots: three sides per triangle */
  triangles: string[][];
}

export interface PricePayload {
  mode: 'total' | 'rate';
  area: AreaEntry;
  rate: string;
  rateUnit: RateUnit;
  total: string;
}

export interface DividePayload {
  area: AreaEntry;
  mode: 'equal' | 'ratio';
  count: string;
  ratios: string;
  system: CompoundSystem;
}

export interface ArithParcel {
  sign: 1 | -1;
  area: AreaEntry;
}

export interface ArithPayload {
  parcels: ArithParcel[];
}

export interface PayloadByKind {
  convert: ConvertPayload;
  plot: PlotPayload;
  price: PricePayload;
  divide: DividePayload;
  arith: ArithPayload;
}

interface HistoryRecordBase<K extends CalcKind> {
  id: string;
  kind: K;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Result area in square feet as a decimal string (for the list view). */
  areaSqft: string;
  payload: PayloadByKind[K];
}

export type HistoryRecord = { [K in CalcKind]: HistoryRecordBase<K> }[CalcKind];

export interface PersistedState {
  settings: Settings;
  meta: AppMeta;
  history: HistoryRecord[];
}
