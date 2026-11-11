import { css } from 'lit';
import { CardTemplate } from './types';

export const WarningTemplate: CardTemplate = {
    name: 'WARNING',
    defaultIcon: 'mdi:alert',
    styles: css`
    .template-warning {
      --template-accent-color: var(
        --warning-color,
        var(--state-active-color, var(--label-badge-yellow, #f59e0b))
      );
      --surface-tint: 14%;
      --facet-alpha-strong: 22%;
      --facet-alpha-soft: 12%;
      animation: origami-warning-flash 3.8s infinite ease-in-out;
    }

    .template-warning .icon-wrap ha-icon {
      animation: origami-warning-icon 3.8s infinite ease-in-out;
    }

    @keyframes origami-warning-flash {
      0%, 100% {
        background-color: color-mix(in srgb, var(--template-accent-color) 10%, var(--base-surface));
        box-shadow: inset 0 0 0 0 transparent;
      }
      50% {
        background-color: color-mix(in srgb, var(--template-accent-color) 26%, var(--base-surface));
        box-shadow: inset 0 0 18px color-mix(in srgb, var(--template-accent-color) 28%, transparent);
      }
    }

    @keyframes origami-warning-icon {
      0%, 100% {
        opacity: 0.82;
        transform: scale(0.97);
      }
      50% {
        opacity: 1;
        transform: scale(1.06);
      }
    }
  `,
};
