import { router, type Href } from 'expo-router';
import React from 'react';

import type { IconName } from '@/components/Icon';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import type { StringKey } from '@/i18n';
import { useApp } from '@/state/AppState';

const TOOLS: { href: Href; icon: IconName; title: StringKey; desc: StringKey }[] = [
  { href: '/price', icon: 'rupee', title: 'tool_price', desc: 'toolDesc_price' },
  { href: '/divide', icon: 'split', title: 'tool_divide', desc: 'toolDesc_divide' },
  { href: '/arithmetic', icon: 'plusMinus', title: 'tool_arith', desc: 'toolDesc_arith' },
  { href: '/reference', icon: 'list', title: 'tool_reference', desc: 'toolDesc_reference' },
];

export default function ToolsScreen() {
  const { tr } = useApp();
  return (
    <Screen>
      <Card>
        {TOOLS.map((tool) => (
          <ListRow
            key={tool.title}
            icon={tool.icon}
            title={tr.t(tool.title)}
            subtitle={tr.t(tool.desc)}
            onPress={() => router.push(tool.href)}
          />
        ))}
      </Card>
    </Screen>
  );
}
