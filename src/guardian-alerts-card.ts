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

  public static getStubConfig(): GuardianAlertsCardConfig {
    return {
      type: 'custom:guardian-alerts-card',
      show_default_alert: true,
      default_alert: {
        template: 'SECURE',
        message: 'All Secured',
        icon: 'mdi:shield-check',
      },
      alerts: [
        {
          entity: '',
          state: '',
          template: 'WARNING',
          message: 'Guardian Alert Triggered',
        },
      ],
    };
  }

  public setConfig(config: GuardianAlertsCardConfig): void {
    if (!config) throw new Error('Invalid configuration');
    this.config = {
      ...config,
      alerts: Array.isArray(config.alerts) ? config.alerts : [],
    };
    this.activeRuleKeys.clear();
    this.hasInitializedStates = false;
  }

  private getRuleKey(rule: AlertRule, index: number): string {
    return `${index}:${rule.entity || ''}:${String(rule.state ?? '').toLowerCase()}`;
  }

  private isRuleActive(rule: AlertRule): boolean {
    if (!rule.entity || rule.state === undefined || rule.state === null) return false;
    const expectedRaw = String(rule.state).trim();
    if (expectedRaw === '') return false;

    const stateObj = this.hass?.states?.[rule.entity];
    if (!stateObj || stateObj.state === undefined || stateObj.state === null) return false;
    const actualRaw = String(stateObj.state).trim();

    // Support numeric or state comparison operators: >, >=, <, <=, !=, ==
    const opMatch = expectedRaw.match(/^(>=|<=|!=|==|>|<)\s*(.+)$/);
    if (opMatch) {
      const [, op, rhsRaw] = opMatch;
      const actualNum = Number(actualRaw);
      const rhsNum = Number(rhsRaw);
      if (actualRaw !== '' && rhsRaw.trim() !== '' && !Number.isNaN(actualNum) && !Number.isNaN(rhsNum)) {
        if (op === '>') return actualNum > rhsNum;
        if (op === '>=') return actualNum >= rhsNum;
        if (op === '<') return actualNum < rhsNum;
        if (op === '<=') return actualNum <= rhsNum;
        if (op === '==') return actualNum === rhsNum;
        if (op === '!=') return actualNum !== rhsNum;
      }
      if (op === '!=') return actualRaw.toLowerCase() !== rhsRaw.trim().toLowerCase();
      if (op === '==') return actualRaw.toLowerCase() === rhsRaw.trim().toLowerCase();
    }

    // Support numeric equality (e.g., 23 matches "23" or "23.0")
    const actualNum = Number(actualRaw);
    const expectedNum = Number(expectedRaw);
    if (actualRaw !== '' && !Number.isNaN(actualNum) && !Number.isNaN(expectedNum)) {
      return actualNum === expectedNum;
    }

    return actualRaw.toLowerCase() === expectedRaw.toLowerCase();
  }

  private formatMessage(rule: AlertRule): string {
    const rawMsg = rule.message || '';
    if (!rule.entity) return rawMsg;
    const stateObj = this.hass?.states?.[rule.entity];
    const currentVal = stateObj?.state ?? '';
    return rawMsg
      .replace(/\{\{\s*state\s*\}\}/g, String(currentVal))
      .replace(/\{\{\s*entity\s*\}\}/g, rule.entity);
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
              defaultMessage: this.formatMessage(rule),
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
        defaultMessage: this.formatMessage(rule),
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
        defaultMessage: this.formatMessage(rule),
      });
    }
  }

  private onPointerCancel() {
    clearTimeout(this.holdTimeout);
    this.isHolding = false;
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    const activeRules = (this.config.alerts || []).filter((rule) => this.isRuleActive(rule));

    let rulesToRender: AlertRule[] = activeRules;
    if (rulesToRender.length === 0) {
      if (this.config.show_default_alert === false) return nothing;

      const defaultAlert = this.config.default_alert;
      rulesToRender = [
        {
          entity: defaultAlert?.entity || this.config.alerts?.[0]?.entity || '',
          state: '',
          template: defaultAlert?.template || 'SECURE',
          message: defaultAlert?.message || 'All Secured',
          icon: defaultAlert?.icon || 'mdi:shield-check',
          icon_color: defaultAlert?.icon_color,
          tap_action:
            defaultAlert?.tap_action ||
            (defaultAlert?.entity ? { action: 'more-info' } : { action: 'none' }),
          hold_action:
            defaultAlert?.hold_action ||
            (defaultAlert?.entity ? { action: 'more-info' } : { action: 'none' }),
        },
      ];
    }

    return html`
      <div class="card-container">
        ${rulesToRender.map((rule) => {
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
                  <span class="message">${this.formatMessage(rule)}</span>
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
    getTemplate('SECURE').styles,
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
