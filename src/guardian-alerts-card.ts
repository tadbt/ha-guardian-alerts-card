import { LitElement, PropertyValues, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { ActionConfig, ActionOrServiceInput, baseCardStyles, getTemplate } from './templates';
import { executeAction } from './utils/action-handler';
import {
  AlertCondition,
  AlertPriority,
  AlertRule,
  DurationConfig,
  GuardianAlertsCardConfig,
  StateOperator,
} from './types';
import './editor';

export type {
  AlertCondition,
  AlertPriority,
  AlertRule,
  DurationConfig,
  GuardianAlertsCardConfig,
  StateOperator,
};

const PRIORITY_RANK: Record<string, number> = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
};

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
    description:
      'Origami-styled security & status alert banners with slow flashing, AND conditions, priority sorting, and multi-service actions.',
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
  private dismissedRuleKeys = new Set<string>();
  private snoozedUntilMap = new Map<string, number>();
  private snoozeTimers = new Map<string, number>();
  private hasInitializedStates = false;

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearAllTimers();
  }

  private clearAllTimers(): void {
    for (const timerId of this.durationTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.durationTimers.clear();

    for (const timerId of this.snoozeTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.snoozeTimers.clear();
  }

  private clearSnoozeForRule(ruleKey: string): void {
    this.snoozedUntilMap.delete(ruleKey);
    const timerId = this.snoozeTimers.get(ruleKey);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      this.snoozeTimers.delete(ruleKey);
    }
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
          priority: 'P1',
          template: 'WARNING',
          message: 'Guardian Alert Triggered',
          tap_action: { action: 'dismiss' },
        },
      ],
    };
  }

  public setConfig(config: GuardianAlertsCardConfig): void {
    if (!config) throw new Error('Invalid configuration');
    this.clearAllTimers();
    this.config = {
      ...config,
      alerts: Array.isArray(config.alerts) ? config.alerts : [],
    };
    this.activeRuleKeys.clear();
    this.matchedSinceMap.clear();
    this.dismissedRuleKeys.clear();
    this.snoozedUntilMap.clear();
    this.hasInitializedStates = false;
  }

  private getTargetStates(cond: AlertCondition): string[] {
    const rawList: Array<string | number | boolean> = [];
    if (Array.isArray(cond.states)) {
      rawList.push(...cond.states);
    }
    if (Array.isArray(cond.state)) {
      rawList.push(...cond.state);
    } else if (cond.state !== undefined && cond.state !== null && String(cond.state).trim() !== '') {
      rawList.push(cond.state);
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

  private getConditionSignature(cond: AlertCondition): string {
    const statesKey = this.getTargetStates(cond).map((s) => s.toLowerCase()).join('|');
    const op = cond.operator || 'equals';
    const dur = this.parseDurationMs(cond.for ?? cond.duration);
    return `${cond.entity || ''}:${op}:${statesKey}:${dur}`;
  }

  private getRuleKey(rule: AlertRule, index: number): string {
    const primarySig = this.getConditionSignature(rule);
    const andSigs = (rule.conditions || [])
      .map((c) => this.getConditionSignature(c))
      .join('&&');
    return `${index}::${primarySig}::${andSigs}`;
  }

  private matchesSingleExpected(
    actualRaw: string,
    expectedRaw: string,
    operator: StateOperator
  ): boolean {
    if (operator === 'contains') {
      return actualRaw.toLowerCase().includes(expectedRaw.toLowerCase());
    }

    const opMatch = expectedRaw.match(/^(>=|<=|!=|==|>|<)\s*(.+)$/);
    if (opMatch) {
      const [, op, rhsRaw] = opMatch;
      const actualNum = Number(actualRaw);
      const rhsNum = Number(rhsRaw);
      if (
        actualRaw !== '' &&
        rhsRaw.trim() !== '' &&
        !Number.isNaN(actualNum) &&
        !Number.isNaN(rhsNum)
      ) {
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

    const actualNum = Number(actualRaw);
    const expectedNum = Number(expectedRaw);
    if (actualRaw !== '' && !Number.isNaN(actualNum) && !Number.isNaN(expectedNum)) {
      return actualNum === expectedNum;
    }

    return actualRaw.toLowerCase() === expectedRaw.toLowerCase();
  }

  private doesConditionStateMatch(cond: AlertCondition): boolean {
    if (!cond.entity) return false;
    const targets = this.getTargetStates(cond);
    if (targets.length === 0) return false;

    const stateObj = this.hass?.states?.[cond.entity];
    if (!stateObj || stateObj.state === undefined || stateObj.state === null) return false;
    const actualRaw = String(stateObj.state).trim();
    const operator: StateOperator = cond.operator || 'equals';

    if (operator === 'not_equals') {
      return targets.every((expected) => !this.matchesSingleExpected(actualRaw, expected, 'equals'));
    }

    if (operator === 'contains') {
      return targets.some((expected) =>
        this.matchesSingleExpected(actualRaw, expected, 'contains')
      );
    }

    return targets.some((expected) => this.matchesSingleExpected(actualRaw, expected, 'equals'));
  }

  private isSingleConditionActive(cond: AlertCondition, conditionKey: string): boolean {
    const matched = this.doesConditionStateMatch(cond);

    if (!matched) {
      this.matchedSinceMap.delete(conditionKey);
      const timerId = this.durationTimers.get(conditionKey);
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        this.durationTimers.delete(conditionKey);
      }
      return false;
    }

    const requiredMs = this.parseDurationMs(cond.for ?? cond.duration);
    if (requiredMs <= 0) {
      return true;
    }

    let matchedSince = this.matchedSinceMap.get(conditionKey);
    if (matchedSince === undefined) {
      const stateObj = this.hass?.states?.[cond.entity];
      const lastChangedMs = stateObj?.last_changed ? Date.parse(stateObj.last_changed) : NaN;
      if (!this.hasInitializedStates && !Number.isNaN(lastChangedMs) && lastChangedMs <= Date.now()) {
        matchedSince = lastChangedMs;
      } else if (!Number.isNaN(lastChangedMs) && Math.abs(Date.now() - lastChangedMs) < 2000) {
        matchedSince = lastChangedMs;
      } else {
        matchedSince = Date.now();
      }
      this.matchedSinceMap.set(conditionKey, matchedSince);
    }

    const elapsedMs = Date.now() - matchedSince;
    if (elapsedMs >= requiredMs) {
      const timerId = this.durationTimers.get(conditionKey);
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        this.durationTimers.delete(conditionKey);
      }
      return true;
    }

    if (!this.durationTimers.has(conditionKey)) {
      const remainingMs = Math.max(20, requiredMs - elapsedMs + 25);
      const timerId = window.setTimeout(() => {
        this.durationTimers.delete(conditionKey);
        this.evaluateAndTriggerRules();
        this.requestUpdate();
      }, remainingMs);
      this.durationTimers.set(conditionKey, timerId);
    }

    return false;
  }

  private isRuleActive(rule: AlertRule, index: number): boolean {
    const ruleKey = this.getRuleKey(rule, index);
    const primaryActive = this.isSingleConditionActive(rule, `${ruleKey}::primary`);

    const extraConditions = (rule.conditions || []).filter(
      (c) => Boolean(c?.entity && this.getTargetStates(c).length > 0)
    );

    // Evaluate all AND conditions so timers are tracked properly for each
    const extrasActive = extraConditions.map((cond, cIdx) =>
      this.isSingleConditionActive(cond, `${ruleKey}::and_${cIdx}`)
    );

    return primaryActive && extrasActive.every(Boolean);
  }

  private isRuleSuppressed(ruleKey: string): boolean {
    if (this.dismissedRuleKeys.has(ruleKey)) {
      return true;
    }
    const snoozedUntil = this.snoozedUntilMap.get(ruleKey);
    if (snoozedUntil !== undefined) {
      if (Date.now() < snoozedUntil) {
        return true;
      }
      this.clearSnoozeForRule(ruleKey);
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
      } else {
        // Reset dismiss & snooze state when the underlying alert condition clears
        this.dismissedRuleKeys.delete(key);
        this.clearSnoozeForRule(key);
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

  private executeRuleInteraction(
    rule: AlertRule,
    index: number | null,
    actionInput?: ActionOrServiceInput
  ): void {
    const resolvedConfig = actionInput || { action: 'more-info' };

    if (!Array.isArray(resolvedConfig) && index !== null) {
      const act = (resolvedConfig as ActionConfig).action;
      const ruleKey = this.getRuleKey(rule, index);

      if (act === 'dismiss') {
        this.dismissedRuleKeys.add(ruleKey);
        this.requestUpdate();
        return;
      }

      if (act === 'snooze' || act === 'snooze_30m' || act === 'delay_30m') {
        const mins = Number((resolvedConfig as ActionConfig).snooze_minutes || 30);
        const delayMs = Math.max(1000, mins * 60 * 1000);
        this.clearSnoozeForRule(ruleKey);
        this.snoozedUntilMap.set(ruleKey, Date.now() + delayMs);

        const timerId = window.setTimeout(() => {
          this.snoozeTimers.delete(ruleKey);
          this.snoozedUntilMap.delete(ruleKey);
          this.requestUpdate();
        }, delayMs + 50);
        this.snoozeTimers.set(ruleKey, timerId);
        this.requestUpdate();
        return;
      }
    }

    executeAction({
      hass: this.hass,
      config: resolvedConfig,
      defaultEntity: rule.entity,
      defaultMessage: this.formatMessage(rule),
    });
  }

  private onPointerDown(rule: AlertRule, index: number | null) {
    this.isHolding = false;
    this.holdTimeout = window.setTimeout(() => {
      this.isHolding = true;
      this.executeRuleInteraction(rule, index, rule.hold_action || { action: 'more-info' });
    }, 500);
  }

  private onPointerUp(rule: AlertRule, index: number | null) {
    clearTimeout(this.holdTimeout);
    if (!this.isHolding) {
      this.executeRuleInteraction(rule, index, rule.tap_action || { action: 'more-info' });
    }
  }

  private onPointerCancel() {
    clearTimeout(this.holdTimeout);
    this.isHolding = false;
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    // Collect active and non-dismissed/non-snoozed rules, then sort by Priority (P1 -> P2 -> P3 -> P4)
    const activeEntries = (this.config.alerts || [])
      .map((rule, index) => ({ rule, index, key: this.getRuleKey(rule, index) }))
      .filter(({ rule, index, key }) => this.isRuleActive(rule, index) && !this.isRuleSuppressed(key))
      .sort((a, b) => {
        const rankA = PRIORITY_RANK[(a.rule.priority || 'P2').toUpperCase()] ?? 2;
        const rankB = PRIORITY_RANK[(b.rule.priority || 'P2').toUpperCase()] ?? 2;
        if (rankA !== rankB) return rankA - rankB;
        return a.index - b.index;
      });

    let entriesToRender: Array<{ rule: AlertRule; index: number | null }> = activeEntries;

    if (entriesToRender.length === 0) {
      if (this.config.show_default_alert === false) return nothing;

      const defaultAlert = this.config.default_alert;
      entriesToRender = [
        {
          index: null,
          rule: {
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
        },
      ];
    }

    return html`
      <div class="card-container">
        ${entriesToRender.map(({ rule, index }) => {
          const tpl = getTemplate(rule.template || rule.severity);
          const icon = rule.icon?.trim() || tpl.defaultIcon;
          const priority = index !== null ? (rule.priority || 'P2').toUpperCase() : null;
          const badgeText = priority ? `${priority} · ${tpl.name}` : tpl.name;

          return html`
            <div class="banner-wrapper">
              <div
                class="banner template-${tpl.name.toLowerCase()}"
                style=${rule.icon_color ? `--custom-icon-color: ${rule.icon_color};` : ''}
                @pointerdown=${() => this.onPointerDown(rule, index)}
                @pointerup=${() => this.onPointerUp(rule, index)}
                @pointercancel=${() => this.onPointerCancel()}
              >
                <div class="icon-wrap">
                  <ha-icon .icon="${icon}"></ha-icon>
                </div>
                <div class="content">
                  <span class="badge">${badgeText}</span>
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
