import { css } from 'lit';

export const baseCardStyles = css`
  :host {
    display: block;
    --base-surface: var(--ha-card-background, var(--card-background-color, #1e293b));
    --base-icon-theme: var(--state-icon-color, var(--paper-item-icon-color, var(--primary-text-color, #f8fafc)));
  }

  .banner-wrapper {
    position: relative;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.16));
    transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), filter 0.18s ease;
  }

  .banner-wrapper:hover {
    transform: translateY(-1px);
  }

  .banner-wrapper:active {
    transform: scale(0.988);
  }

  .banner {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 18px 18px 16px;
    border-radius: var(--ha-card-border-radius, 12px);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;

    /* Multi-faceted origami paper planes tinted by HA theme + template accent */
    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--template-accent-color) var(--facet-alpha-strong, 18%), transparent) 0%,
        transparent 50%
      ),
      linear-gradient(
        225deg,
        color-mix(in srgb, var(--template-accent-color) var(--facet-alpha-soft, 10%), transparent) 0%,
        transparent 58%
      ),
      color-mix(in srgb, var(--template-accent-color) var(--surface-tint, 12%), var(--base-surface));

    box-shadow:
      inset 0 1px 0 color-mix(in srgb, var(--template-accent-color) 28%, rgba(255, 255, 255, 0.12)),
      inset 0 0 0 1px color-mix(in srgb, var(--template-accent-color) 22%, transparent);
  }

  /* Subtle diagonal origami paper crease across the surface */
  .banner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      118deg,
      transparent 44%,
      color-mix(in srgb, var(--template-accent-color) 14%, rgba(255, 255, 255, 0.05)) 44.3%,
      transparent 45%
    );
    pointer-events: none;
  }

  /* Bottom origami ribbon / tape strip in the color of the alert */
  .bottom-ribbon {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 6px;
    background: linear-gradient(
      90deg,
      var(--template-accent-color) 0%,
      color-mix(in srgb, var(--template-accent-color) 82%, #ffffff) 35%,
      var(--template-accent-color) 72%,
      color-mix(in srgb, var(--template-accent-color) 70%, #000000) 100%
    );
    box-shadow: 0 -1px 6px color-mix(in srgb, var(--template-accent-color) 45%, transparent);
    pointer-events: none;
    z-index: 2;
  }

  /* Folded tape accent crease on the bottom ribbon */
  .bottom-ribbon::after {
    content: '';
    position: absolute;
    top: -3px;
    left: 18px;
    width: 44px;
    height: 6px;
    background: var(--template-accent-color);
    clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 100%, 0 100%);
    box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.2);
  }

  /* Folded geometric origami medallion for the icon */
  .icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    clip-path: polygon(22% 0%, 100% 0%, 100% 78%, 78% 100%, 0% 100%, 0% 22%);
    background: linear-gradient(
      145deg,
      color-mix(in srgb, var(--template-accent-color) 28%, var(--base-surface)),
      color-mix(in srgb, var(--template-accent-color) 12%, var(--base-surface))
    );
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--template-accent-color) 45%, transparent);
  }

  /* Theme-aware icon color: blends HA theme icon color with template accent (or explicit override) */
  .icon-wrap ha-icon {
    --mdc-icon-size: 24px;
    color: var(
      --custom-icon-color,
      var(
        --guardian-icon-color,
        color-mix(in srgb, var(--template-accent-color) 72%, var(--base-icon-theme) 28%)
      )
    );
    filter: drop-shadow(0 1px 4px color-mix(in srgb, var(--template-accent-color) 45%, transparent));
    transition: color 0.25s ease, transform 0.25s ease;
  }

  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  .badge-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
  }

  .badge {
    display: inline-block;
    padding: 2px 10px 2px 7px;
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--template-accent-color);
    background: color-mix(in srgb, var(--template-accent-color) 18%, var(--base-surface));
    clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 100%, 0 100%);
  }

  .last-changed-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: var(--secondary-text-color, #cbd5e1);
    background: color-mix(in srgb, var(--template-accent-color) 10%, var(--base-surface));
    border: 1px solid color-mix(in srgb, var(--template-accent-color) 26%, transparent);
    border-radius: 4px;
  }

  .message {
    width: 100%;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--primary-text-color, #f3f4f6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* On-Hold action choice overlay (Snooze 30m / Dismiss) */
  .hold-menu-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 16px 6px 16px;
    background: color-mix(in srgb, var(--base-surface) 92%, #000000 8%);
    backdrop-filter: blur(6px);
    animation: fadeInHoldMenu 0.15s ease-out;
  }

  @keyframes fadeInHoldMenu {
    from {
      opacity: 0;
      transform: scale(0.98);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .hold-menu-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--secondary-text-color, #cbd5e1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hold-menu-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .hold-btn {
    cursor: pointer;
    border-radius: 6px;
    font-size: 0.76rem;
    font-weight: 700;
    padding: 6px 11px;
    border: 1px solid transparent;
    transition: transform 0.12s ease, filter 0.12s ease;
  }

  .hold-btn:hover {
    filter: brightness(1.12);
  }

  .hold-btn:active {
    transform: scale(0.96);
  }

  .hold-btn-snooze {
    background: color-mix(in srgb, var(--warning-color, #f59e0b) 22%, var(--base-surface));
    color: var(--warning-color, #fbbf24);
    border-color: color-mix(in srgb, var(--warning-color, #f59e0b) 45%, transparent);
  }

  .hold-btn-dismiss {
    background: color-mix(in srgb, var(--error-color, #ef4444) 22%, var(--base-surface));
    color: var(--error-color, #f87171);
    border-color: color-mix(in srgb, var(--error-color, #ef4444) 45%, transparent);
  }

  .hold-btn-cancel {
    background: rgba(255, 255, 255, 0.08);
    color: var(--primary-text-color, #f3f4f6);
    border-color: rgba(255, 255, 255, 0.14);
  }
`;
