import { css } from 'lit';
import { CardTemplate } from './types';

export const InfoTemplate: CardTemplate = {
    name: 'INFO',
    defaultIcon: 'mdi:information-outline',
    styles: css`
    /* INFO remains static (no flashing) and adapts to HA theme info/primary/icon colors */
    .template-info {
      --template-accent-color: var(
        --info-color,
        var(--primary-color, var(--label-badge-blue, #38bdf8))
      );
      --surface-tint: 10%;
      --facet-alpha-strong: 16%;
      --facet-alpha-soft: 8%;
    }
  `,
};
