import { css } from 'lit';
import { CardTemplate } from './types';

export const SecureTemplate: CardTemplate = {
  name: 'SECURE',
  defaultIcon: 'mdi:shield-check',
  styles: css`
    /* SECURE remains static (no flashing) with a green theme-aware accent color */
    .template-secure {
      --template-accent-color: var(
        --success-color,
        var(--label-badge-green, #22c55e)
      );
      --surface-tint: 12%;
      --facet-alpha-strong: 18%;
      --facet-alpha-soft: 10%;
    }
  `,
};

