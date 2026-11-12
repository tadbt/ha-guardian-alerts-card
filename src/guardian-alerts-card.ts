import { LitElement, PropertyValues, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { baseCardStyles, getTemplate } from './templates';
import { executeAction } from './utils/action-handler';
import { AlertRule, DurationConfig, GuardianAlertsCardConfig, StateOperator } from './types';
import './editor';

export type { AlertRule, DurationConfig, GuardianAlertsCardConfig, StateOperator };

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
  private matchedSinceMap = new Map<string, number>();
  private durationTimers = new Map<string, number>();
  private hasInitializedStates = false;

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearAllDurationTimers();
  }

  private clearAllDurationTimers(): void {
    for (const timerId of this.durationTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.durationTimers.clear();
  }

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
          state: [],
          operator: 'equals',
          template: 'WARNING',
          message: 'Guardian Alert Triggered',
        },
      ],
    };
  }

  public setConfig(config: GuardianAlertsCardConfig): void {
    if (!config) throw new Error('Invalid configuration');
    this.clearAllDurationTimers();
    this.config = {
      ...config,
      alerts: Array.isArray(config.alerts) ? config.alerts : [],
    };
    this.activeRuleKeys.clear();
    this.matchedSinceMap.clear();
    this.hasInitializedStates = false;
  }

  private getTargetStates(rule: AlertRule): string[] {
    const rawList: Array<string | number | boolean> = [];
    if (Array.isArray(rule.states)) {
      rawList.push(...rule.states);
    }
    if (Array.isArray(rule.state)) {
      rawList.push(...rule.state);
    } else if (rule.state !== undefined && rule.state !== null && String(rule.state).trim() !== '') {
      rawList.push(rule.state);
    }
    return Array.from(
      new Set(
        rawList
          .map((v) => String(v).trim())
          .filter((v) => v !== '')
      )
    );
  }

  private parseDurationMs(raw?: DurationConfig | number | string): number {
    if (raw === undefined || raw === null || raw === '') return 0;
    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? Math.max(0, raw * 1000) : 0;
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return 0;
      if (/^\d+(\.\d+)?$/.test(trimmed)) {
        return Math.max(0, Number(trimmed) * 1000);
      }
      const hmsMatch = trimmed.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
      if (hmsMatch) {
        const hasThree = hmsMatch[3] !== undefined;
        const hours = hasThree ? Number(hmsMatch[1]) : 0;
        const minutes = hasThree ? Number(hmsMatch[2]) : Number(hmsMatch[1]);
        const seconds = hasThree ? Number(hmsMatch[3]) : Number(hmsMatch[2]);
        return Math.max(0, ((hours * 60 + minutes) * 60 + seconds) * 1000);
      }
      const unitMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(ms|s|sec|m|min|h|hr|d)$/i);
      if (unitMatch) {
        const val = Number(unitMatch[1]);
        const unit = unitMatch[2].toLowerCase();
        if (unit === 'ms') return val;
        if (unit === 's' || unit === 'sec') return val * 1000;
        if (unit === 'm' || unit === 'min') return val * 60_000;
        if (unit === 'h' || unit === 'hr') return val * 3_600_000;
        if (unit === 'd') return val * 86_400_000;
      }
      return 0;
    }
    if (typeof raw === 'object') {
      const days = Number(raw.days || 0);
      const hours = Number(raw.hours || 0);
      const minutes = Number(raw.minutes || 0);
      const seconds = Number(raw.seconds || 0);
      const ms = Number(raw.milliseconds || 0);
      return Math.max(0, (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000 + ms);
    }
    return 0;
  }

  private getRuleKey(rule: AlertRule, index: number): string {
    const statesKey = this.getTargetStates(rule).map((s) => s.toLowerCase()).join('|');
    const op = rule.operator || 'equals';
    const dur = this.parseDurationMs(rule.for ?? rule.duration);
    return `${index}:${rule.entity || ''}:${op}:${statesKey}:${dur}`;
  }

  private matchesSingleExpected(actualRaw: string, expectedRaw: string, operator: StateOperator): boolean {
    if (operator === 'contains') {
      return actualRaw.toLowerCase().includes(expectedRaw.toLowerCase());
    }

    // Support inline numeric or state comparison prefixes: >, >=, <, <=, !=, ==
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

    // Exact numeric equality (e.g., 23 matches "23" or "23.0")
    const actualNum = Number(actualRaw);
    const expectedNum = Number(expectedRaw);
    if (actualRaw !== '' && !Number.isNaN(actualNum) && !Number.isNaN(expectedNum)) {
      return actualNum === expectedNum;
    }

    return actualRaw.toLowerCase() === expectedRaw.toLowerCase();
  }

  private doesStateMatch(rule: AlertRule): boolean {
    if (!rule.entity) return false;
    const targets = this.getTargetStates(rule);
    if (targets.length === 0) return false;

    const stateObj = this.hass?.states?.[rule.entity];
    if (!stateObj || stateObj.state === undefined || stateObj.state === null) return false;
    const actualRaw = String(stateObj.state).trim();
    const operator: StateOperator = rule.operator || 'equals';

    if (operator === 'not_equals') {
      return targets.every((expected) => !this.matchesSingleExpected(actualRaw, expected, 'equals'));
    }

    if (operator === 'contains') {
      return targets.some((expected) => this.matchesSingleExpected(actualRaw, expected, 'contains'));
    }

    return targets.some((expected) => this.matchesSingleExpected(actualRaw, expected, 'equals'));
  }

  private isRuleActive(rule: AlertRule, index: number): boolean {
    const key = this.getRuleKey(rule, index);
    const matched = this.doesStateMatch(rule);

    if (!matched) {
      this.matchedSinceMap.delete(key);
      const timerId = this.durationTimers.get(key);
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        this.durationTimers.delete(key);
      }
      return false;
    }

    const requiredMs = this.parseDurationMs(rule.for ?? rule.duration);
    if (requiredMs <= 0) {
      return true;
    }

    let matchedSince = this.matchedSinceMap.get(key);
    if (matchedSince === undefined) {
      const stateObj = this.hass?.states?.[rule.entity];
      const lastChangedMs = stateObj?.last_changed ? Date.parse(stateObj.last_changed) : NaN;
      if (!this.hasInitializedStates && !Number.isNaN(lastChangedMs) && lastChangedMs <= Date.now()) {
        matchedSince = lastChangedMs;
      } else if (!Number.isNaN(lastChangedMs) && Math.abs(Date.now() - lastChangedMs) < 2000) {
        matchedSince = lastChangedMs;
      } else {
        matchedSince = Date.now();
      }
      this.matchedSinceMap.set(key, matchedSince);
    }

    const elapsedMs = Date.now() - matchedSince;
    if (elapsedMs >= requiredMs) {
      const timerId = this.durationTimers.get(key);
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        this.durationTimers.delete(key);
      }
      return true;
    }

    if (!this.durationTimers.has(key)) {
      const remainingMs = Math.max(20, requiredMs - elapsedMs + 25);
      const timerId = window.setTimeout(() => {
        this.durationTimers.delete(key);
        this.evaluateAndTriggerRules();
        this.requestUpdate();
      }, remainingMs);
      this.durationTimers.set(key, timerId);
    }

    return false;
  }

  private evaluateAndTriggerRules(): void {
    if (!this.hass || !this.config) return;
    const nextActiveKeys = new Set<string>();

    (this.config.alerts || []).forEach((rule, index) => {
      const key = this.getRuleKey(rule, index);
      const active = this.isRuleActive(rule, index);

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
      this.evaluateAndTriggerRules();
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

    const activeRules = (this.config.alerts || []).filter((rule, index) =>
      this.isRuleActive(rule, index)
    );

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
