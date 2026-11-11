import { LitElement, PropertyValues, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { baseCardStyles, getTemplate } from './templates';
import { executeAction } from './utils/action-handler';
import { AlertRule, GuardianAlertsCardConfig } from './types';
import './editor';

export type { AlertRule, GuardianAlertsCardConfig };

declare global {
  interface Window {
    customCards?: Array<{
      type: string;
      name: string;
      description: string;
      preview?: boolean;
    }>;
  }
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'guardian-alerts-card')) {
  window.customCards.push({
    type: 'guardian-alerts-card',
    name: 'Guardian Alerts Card',
    description: 'Origami-styled security & status alert banners with slow flashing and multi-service actions.',
    preview: true,
  });
}

@customElement('guardian-alerts-card')
export class GuardianAlertsCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: GuardianAlertsCardConfig;

  private holdTimeout?: number;
  private isHolding = false;
  private activeRuleKeys = new Set<string>();
  private hasInitializedStates = false;

  public static getConfigElement(): HTMLElement {
    return document.createElement('guardian-alerts-card-editor');
  }

  public static getStubConfig(hass?: HomeAssistant): GuardianAlertsCardConfig {
    const sampleEntity =
      Object.keys(hass?.states || {}).find((id) => id.startsWith('binary_sensor.')) ||
      Object.keys(hass?.states || {})[0] ||
      'binary_sensor.garage_entry_door';

    return {
      type: 'custom:guardian-alerts-card',
      alerts: [
        {
          entity: sampleEntity,
          state: 'on',
          template: 'WARNING',
          message: 'Guardian Alert Triggered',
        },
      ],
    };
  }

  public setConfig(config: GuardianAlertsCardConfig): void {
    if (!config?.alerts) throw new Error('Define an "alerts" array in your configuration');
    this.config = config;
    this.activeRuleKeys.clear();
    this.hasInitializedStates = false;
  }

  private getRuleKey(rule: AlertRule, index: number): string {
    return `${index}:${rule.entity}:${rule.state.toLowerCase()}`;
  }

  private isRuleActive(rule: AlertRule): boolean {
    const stateObj = this.hass?.states?.[rule.entity];
    return Boolean(stateObj && stateObj.state.toLowerCase() === rule.state.toLowerCase());
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this.hass || !this.config) return;

    if (changedProps.has('hass') || changedProps.has('config')) {
      const nextActiveKeys = new Set<string>();

      this.config.alerts.forEach((rule, index) => {
        const key = this.getRuleKey(rule, index);
        const active = this.isRuleActive(rule);

        if (active) {
          nextActiveKeys.add(key);
          // Fire on_active when transitioning from inactive -> active (after initial state snapshot)
          if (this.hasInitializedStates && !this.activeRuleKeys.has(key) && rule.on_active) {
            executeAction({
              hass: this.hass,
              config: rule.on_active,
              defaultEntity: rule.entity,
              defaultMessage: rule.message,
            });
          }
        }
      });

      this.activeRuleKeys = nextActiveKeys;
      this.hasInitializedStates = true;
    }
  }

  private onPointerDown(rule: AlertRule) {
    this.isHolding = false;
    this.holdTimeout = window.setTimeout(() => {
      this.isHolding = true;
      executeAction({
        hass: this.hass,
        config: rule.hold_action || { action: 'more-info' },
        defaultEntity: rule.entity,
        defaultMessage: rule.message,
      });
    }, 500); // 500ms hold threshold
  }

  private onPointerUp(rule: AlertRule) {
    clearTimeout(this.holdTimeout);
    if (!this.isHolding) {
      executeAction({
        hass: this.hass,
        config: rule.tap_action || { action: 'more-info' },
        defaultEntity: rule.entity,
        defaultMessage: rule.message,
      });
    }
  }

  private onPointerCancel() {
    clearTimeout(this.holdTimeout);
    this.isHolding = false;
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    const activeRules = this.config.alerts.filter((rule) => this.isRuleActive(rule));

    if (activeRules.length === 0) return nothing;

    return html`
      <div class="card-container">
        ${activeRules.map((rule) => {
          const tpl = getTemplate(rule.template || rule.severity);
          const icon = rule.icon?.trim() || tpl.defaultIcon;

          return html`
            <div class="banner-wrapper">
              <div
                class="banner template-${tpl.name.toLowerCase()}"
                style=${rule.icon_color ? `--custom-icon-color: ${rule.icon_color};` : ''}
                @pointerdown=${() => this.onPointerDown(rule)}
                @pointerup=${() => this.onPointerUp(rule)}
                @pointercancel=${() => this.onPointerCancel()}
              >
                <div class="icon-wrap">
                  <ha-icon .icon="${icon}"></ha-icon>
                </div>
                <div class="content">
                  <span class="badge">${tpl.name}</span>
                  <span class="message">${rule.message}</span>
                </div>
                <span class="bottom-ribbon" aria-hidden="true"></span>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  static styles = [
    baseCardStyles,
    getTemplate('INFO').styles,
    getTemplate('WARNING').styles,
    getTemplate('CRITICAL').styles,
    css`
      .card-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `,
  ];
}
