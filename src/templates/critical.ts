import { css } from 'lit';
import { CardTemplate } from './types';

export const CriticalTemplate: CardTemplate = {
    name: 'CRITICAL',
    defaultIcon: 'mdi:shield-alert',
    styles: css`
    .template-critical {
      --template-accent-color: var(
        --error-color,
        var(--label-badge-red, #ef4444)
      );
      --surface-tint: 18%;
      --facet-alpha-strong: 28%;
      --facet-alpha-soft: 16%;
      animation: origami-critical-flash 2.6s infinite ease-in-out;
    }

    .template-critical .icon-wrap ha-icon {
      animation: origami-critical-icon 2.6s infinite ease-in-out;
    }

    @keyframes origami-critical-flash {
      0%, 100% {
        background-color: color-mix(in srgb, var(--template-accent-color) 12%, var(--base-surface));
        box-shadow: inset 0 0 0 0 transparent;
      }
      50% {
        background-color: color-mix(in srgb, var(--template-accent-color) 34%, var(--base-surface));
        box-shadow: inset 0 0 24px color-mix(in srgb, var(--template-accent-color) 42%, transparent);
      }
    }

    @keyframes origami-critical-icon {
      0%, 100% {
        opacity: 0.8;
        transform: scale(0.95);
      }
      50% {
        opacity: 1;
        transform: scale(1.1);
      }
    }
  `,
};
