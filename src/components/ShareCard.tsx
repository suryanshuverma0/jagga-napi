import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ShareCardModel, ShareLine } from '@/share/model';
import { light, type } from '@/theme';
import { PlotPreview } from './PlotPreview';

const C = {
  bg: '#FFFFFF',
  band: light.primary,
  onBand: '#FFFFFF',
  text: '#16201A',
  muted: '#4F5D55',
  rule: '#DCE3DA',
  plot: { fill: 'rgba(27,107,74,0.12)', stroke: light.primary, text: '#16201A', accent: light.accent },
};

function Lines({ lines, big }: { lines: ShareLine[]; big?: boolean }) {
  return (
    <>
      {lines.map((l, i) => (
        <View key={i} style={[styles.line, i > 0 && { borderTopColor: C.rule, borderTopWidth: 1 }]}>
          <Text style={[type.label, { color: C.muted }]}>{l.label}</Text>
          <Text style={[big && i === 0 ? type.title : type.bodyStrong, { color: C.text }]}>{l.value}</Text>
          {l.detail ? <Text style={[type.small, { color: C.muted }]}>{l.detail}</Text> : null}
        </View>
      ))}
    </>
  );
}

/**
 * The image people send on Viber/WhatsApp/Messenger. Fixed width and light colours so it reads
 * the same whatever theme the sender uses. The disclaimer line is always present; the watermark
 * line can be hidden for one image after a rewarded ad.
 */
export function ShareCard({
  model,
  showWatermark,
  labels,
  width = 360,
}: {
  model: ShareCardModel;
  showWatermark: boolean;
  labels: { inputs: string; results: string; date: string };
  width?: number;
}) {
  return (
    <View style={[styles.card, { width }]} collapsable={false}>
      <View style={styles.band}>
        <Text style={[type.title, { color: C.onBand }]}>{model.title}</Text>
        {model.name ? <Text style={[type.bodyStrong, { color: C.onBand }]}>{model.name}</Text> : null}
      </View>
      <View style={styles.body}>
        <Text style={[type.label, styles.section]}>{labels.inputs}</Text>
        <Lines lines={model.inputs} />
        {model.drawing ? (
          <View style={styles.drawing}>
            <PlotPreview
              shape={model.drawing.shape}
              sides={model.drawing.sides}
              unitLabel={model.drawing.unitLabel}
              colors={C.plot}
            />
          </View>
        ) : null}
        <Text style={[type.label, styles.section]}>{labels.results}</Text>
        <Lines lines={model.results} big />
        <Text style={[type.small, { color: C.muted, marginTop: 12 }]}>
          {labels.date}: {model.date}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={[type.small, { color: C.muted }]}>{model.disclaimer}</Text>
        {showWatermark ? (
          <Text style={[type.label, { color: C.band, fontWeight: '700' }]}>{model.watermark}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.bg, borderRadius: 16, overflow: 'hidden' },
  band: { backgroundColor: C.band, paddingHorizontal: 18, paddingVertical: 14 },
  body: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4 },
  section: { color: C.band, fontWeight: '700', marginTop: 10, marginBottom: 2, textTransform: 'uppercase' },
  line: { paddingVertical: 6 },
  drawing: { marginVertical: 6, borderRadius: 12, backgroundColor: '#F6F8F5' },
  footer: { borderTopColor: C.rule, borderTopWidth: 1, paddingHorizontal: 18, paddingVertical: 10, gap: 2 },
});
