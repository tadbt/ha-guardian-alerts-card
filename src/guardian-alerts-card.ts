import { LitElement, PropertyValues, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { baseCardStyles, getTemplate } from './templates';
import { playChime } from './chime';
import {
  AlertPriority,
  AlertRule,
  ChimeType,
  DurationConfig,
  GuardianAlertsCardConfig,
  KeypadConfig,
  StateOperator,
} from './types';
import './editor';

export type {
  AlertPriority,
  AlertRule,
  ChimeType,
  DurationConfig,
  GuardianAlertsCardConfig,
  KeypadConfig,
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
      'Origami-styled security & status alert banners with multi-entity monitoring, chime notifications, last-changed badge, and on-hold snooze/dismiss.',
    preview: true,
  });
}

@customElement('guardian-alerts-card')
export class GuardianAlertsCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: GuardianAlertsCardConfig;
  @state() private holdMenuKey: string | null = null;
  @state() private keypadOpen = false;
  @state() private keypadCode = '';
  @state() private keypadFeedback: { type: 'error' | 'success'; text: string } | null = null;
  @state() private armDelayRemaining = 0;

  private holdTimeout?: number;
  private keypadFeedbackTimer?: number;
  private armDelayInterval?: number;
  private isHolding = false;
  private relativeTimeInterval?: number;
  private activeEntryKeys = new Set<string>();
  private matchedSinceMap = new Map<string, number>();
  private durationTimers = new Map<string, number>();
  private dismissedEntryKeys = new Set<string>();
  private snoozedUntilMap = new Map<string, number>();
  private snoozeTimers = new Map<string, number>();
  private hasInitializedStates = false;

  public connectedCallback(): void {
    super.connectedCallback();
    // Periodically re-evaluate duration rules and refresh relative "last changed" badges
    this.relativeTimeInterval = window.setInterval(() => {
      this.evaluateRules();
      this.requestUpdate();
    }, 15_000);
    document.addEventListener('visibilitychange', this.handleVisibilityOrFocus);
    window.addEventListener('focus', this.handleVisibilityOrFocus);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.relativeTimeInterval !== undefined) {
      window.clearInterval(this.relativeTimeInterval);
      this.relativeTimeInterval = undefined;
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityOrFocus);
    window.removeEventListener('focus', this.handleVisibilityOrFocus);
    this.clearAllTimers();
  }

  private handleVisibilityOrFocus = (): void => {
    if (document.visibilityState === 'hidden') return;
    this.evaluateRules();
    this.requestUpdate();
  };

  private clearAllTimers(): void {
    window.clearTimeout(this.holdTimeout);
    window.clearTimeout(this.keypadFeedbackTimer);
    window.clearInterval(this.armDelayInterval);
    this.armDelayInterval = undefined;
    for (const timerId of this.durationTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.durationTimers.clear();

    for (const timerId of this.snoozeTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.snoozeTimers.clear();
  }

  private clearSnoozeForEntry(entryKey: string): void {
    this.snoozedUntilMap.delete(entryKey);
    const timerId = this.snoozeTimers.get(entryKey);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      this.snoozeTimers.delete(entryKey);
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
          entities: [],
          state: [],
          operator: 'equals',
          priority: 'P1',
          template: 'WARNING',
          chime: 'none',
          message: '',
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
    this.holdMenuKey = null;
    this.keypadOpen = false;
    this.keypadCode = '';
    this.keypadFeedback = null;
    this.armDelayRemaining = 0;
    this.activeEntryKeys.clear();
    this.matchedSinceMap.clear();
    this.dismissedEntryKeys.clear();
    this.snoozedUntilMap.clear();
    this.hasInitializedStates = false;
  }

  private getMonitoredEntities(rule: AlertRule): string[] {
    if (Array.isArray(rule.entities)) {
      const fromArray = rule.entities
        .filter((e): e is string => typeof e === 'string' && e.trim() !== '')
        .map((e) => e.trim());
      if (fromArray.length > 0) {
        return Array.from(new Set(fromArray));
      }
    }
    if (typeof rule.entity === 'string' && rule.entity.trim() !== '') {
      return [rule.entity.trim()];
    }
    return [];
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

  private getEntryKey(rule: AlertRule, index: number, entityId: string): string {
    const statesKey = this.getTargetStates(rule).map((s) => s.toLowerCase()).join('|');
    const op = rule.operator || 'equals';
    const dur = this.parseDurationMs(rule.for ?? rule.duration);
    return `${index}::${entityId}::${op}::${statesKey}::${dur}`;
  }

  private matchesSingleExpected(
    actualRaw: string,
    expectedRaw: string,
    operator: StateOperator
  ): boolean {
    if (operator === 'contains') {
      return actualRaw.toLowerCase().includes(expectedRaw.toLowerCase());
    }

    if (operator === 'gt' || operator === 'gte' || operator === 'lt' || operator === 'lte') {
      const actualNum = Number(actualRaw);
      const expectedNum = Number(expectedRaw.trim());
      if (
        actualRaw === '' ||
        expectedRaw.trim() === '' ||
        Number.isNaN(actualNum) ||
        Number.isNaN(expectedNum)
      ) {
        return false;
      }
      if (operator === 'gt') return actualNum > expectedNum;
      if (operator === 'gte') return actualNum >= expectedNum;
      if (operator === 'lt') return actualNum < expectedNum;
      return actualNum <= expectedNum;
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

  private doesEntityMatchRule(rule: AlertRule, entityId: string): boolean {
    if (!entityId) return false;
    const targets = this.getTargetStates(rule);
    if (targets.length === 0) return false;

    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj || stateObj.state === undefined || stateObj.state === null) return false;
    const actualRaw = String(stateObj.state).trim();
    const operator: StateOperator = rule.operator || 'equals';

    if (operator === 'not_equals') {
      return targets.every((expected) => !this.matchesSingleExpected(actualRaw, expected, 'equals'));
    }

    return targets.some((expected) => this.matchesSingleExpected(actualRaw, expected, operator));
  }

  private isEntityEntryActive(rule: AlertRule, index: number, entityId: string): boolean {
    const entryKey = this.getEntryKey(rule, index, entityId);
    const matched = this.doesEntityMatchRule(rule, entityId);

    if (!matched) {
      this.matchedSinceMap.delete(entryKey);
      const timerId = this.durationTimers.get(entryKey);
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        this.durationTimers.delete(entryKey);
      }
      return false;
    }

    const requiredMs = this.parseDurationMs(rule.for ?? rule.duration);
    if (requiredMs <= 0) {
      return true;
    }

    const now = Date.now();
    const stateObj = this.hass?.states?.[entityId];
    const lastChangedMs = stateObj?.last_changed ? Date.parse(stateObj.last_changed) : NaN;
    const validLastChangedMs = !Number.isNaN(lastChangedMs) ? Math.min(now, lastChangedMs) : NaN;

    let matchedSince = this.matchedSinceMap.get(entryKey);
    if (matchedSince === undefined) {
      // Use Home Assistant's authoritative stateObj.last_changed timestamp so rules
      // that have already been in the matching state for > `for` duration trigger immediately on load.
      matchedSince = !Number.isNaN(validLastChangedMs) ? validLastChangedMs : now;
      this.matchedSinceMap.set(entryKey, matchedSince);
    } else if (!Number.isNaN(validLastChangedMs) && validLastChangedMs < matchedSince) {
      matchedSince = validLastChangedMs;
      this.matchedSinceMap.set(entryKey, matchedSince);
    }

    const elapsedMs = now - matchedSince;
    if (elapsedMs >= requiredMs) {
      const timerId = this.durationTimers.get(entryKey);
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        this.durationTimers.delete(entryKey);
      }
      return true;
    }

    if (!this.durationTimers.has(entryKey)) {
      const remainingMs = Math.max(20, requiredMs - elapsedMs + 25);
      const timerId = window.setTimeout(() => {
        this.durationTimers.delete(entryKey);
        this.evaluateRules();
        this.requestUpdate();
      }, remainingMs);
      this.durationTimers.set(entryKey, timerId);
    }

    return false;
  }

  private isEntrySuppressed(entryKey: string): boolean {
    if (this.dismissedEntryKeys.has(entryKey)) {
      return true;
    }
    const snoozedUntil = this.snoozedUntilMap.get(entryKey);
    if (snoozedUntil !== undefined) {
      if (Date.now() < snoozedUntil) {
        return true;
      }
      this.clearSnoozeForEntry(entryKey);
    }
    return false;
  }

  private evaluateRules(): void {
    if (!this.hass || !this.config) return;
    const nextActiveKeys = new Set<string>();

    (this.config.alerts || []).forEach((rule, index) => {
      const entities = this.getMonitoredEntities(rule);
      for (const entityId of entities) {
        const entryKey = this.getEntryKey(rule, index, entityId);
        const active = this.isEntityEntryActive(rule, index, entityId);

        if (active) {
          nextActiveKeys.add(entryKey);
          if (
            this.hasInitializedStates &&
            !this.activeEntryKeys.has(entryKey) &&
            !this.isEntrySuppressed(entryKey) &&
            rule.chime &&
            rule.chime !== 'none'
          ) {
            playChime(rule.chime);
          }
        } else {
          // Reset dismiss, snooze, and open hold menu when condition clears
          this.dismissedEntryKeys.delete(entryKey);
          this.clearSnoozeForEntry(entryKey);
          if (this.holdMenuKey === entryKey) {
            this.holdMenuKey = null;
          }
        }
      }
    });

    this.activeEntryKeys = nextActiveKeys;
    this.hasInitializedStates = true;
  }

  private formatMessage(rule: AlertRule, entityId: string): string {
    const rawMsg = (rule.message || '').trim();
    if (!entityId) return rawMsg;
    const stateObj = this.hass?.states?.[entityId];
    const currentVal = stateObj?.state ?? '';
    const friendlyName = stateObj?.attributes?.friendly_name || entityId;

    if (!rawMsg) {
      return stateObj ? `${friendlyName} is ${currentVal}` : String(friendlyName);
    }
    return rawMsg
      .replace(/\{\{\s*state\s*\}\}/g, String(currentVal))
      .replace(/\{\{\s*entity\s*\}\}/g, entityId)
      .replace(/\{\{\s*(?:name|friendly_name)\s*\}\}/g, String(friendlyName));
  }

  private formatLastChanged(entityId: string): { relative: string; full: string } | null {
    if (!entityId) return null;
    const raw = this.hass?.states?.[entityId]?.last_changed;
    if (!raw) return null;
    const ts = Date.parse(raw);
    if (Number.isNaN(ts)) return null;

    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    const full = new Date(ts).toLocaleString();

    if (diffSec < 15) return { relative: 'Just now', full };
    if (diffSec < 60) return { relative: `${diffSec}s ago`, full };
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return { relative: `${diffMin}m ago`, full };
    const diffHr = Math.floor(diffMin / 60);
    const remMin = diffMin % 60;
    if (diffHr < 24) {
      return { relative: remMin > 0 ? `${diffHr}h ${remMin}m ago` : `${diffHr}h ago`, full };
    }
    const diffDays = Math.floor(diffHr / 24);
    return { relative: `${diffDays}d ago`, full };
  }

  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    if (!this.hass || !this.config) return;

    if (changedProps.has('hass') || changedProps.has('config')) {
      this.evaluateRules();
    }
  }

  private onBannerPointerDown(entryKey: string | null): void {
    if (!entryKey || this.holdMenuKey === entryKey) return;
    this.isHolding = false;
    window.clearTimeout(this.holdTimeout);
    this.holdTimeout = window.setTimeout(() => {
      this.isHolding = true;
      this.holdMenuKey = entryKey;
    }, 450);
  }

  private onBannerPointerUp(entityId: string, entryKey: string | null): void {
    window.clearTimeout(this.holdTimeout);
    if (this.isHolding) {
      this.isHolding = false;
      return;
    }
    if (entryKey && this.holdMenuKey === entryKey) {
      return;
    }
    if (entityId) {
      window.dispatchEvent(
        new CustomEvent('hass-more-info', {
          bubbles: true,
          composed: true,
          detail: { entityId },
        })
      );
    }
  }

  private onBannerPointerCancel(): void {
    window.clearTimeout(this.holdTimeout);
    this.isHolding = false;
  }

  private onBannerContextMenu(ev: Event, entryKey: string | null): void {
    if (!entryKey) return;
    ev.preventDefault();
    window.clearTimeout(this.holdTimeout);
    this.isHolding = false;
    this.holdMenuKey = entryKey;
  }

  private handleDismiss(entryKey: string, ev: Event): void {
    ev.stopPropagation();
    this.dismissedEntryKeys.add(entryKey);
    if (this.holdMenuKey === entryKey) {
      this.holdMenuKey = null;
    }
    this.requestUpdate();
  }

  private handleSnooze30m(entryKey: string, ev: Event): void {
    ev.stopPropagation();
    const delayMs = 30 * 60 * 1000;
    this.clearSnoozeForEntry(entryKey);
    this.snoozedUntilMap.set(entryKey, Date.now() + delayMs);

    const timerId = window.setTimeout(() => {
      this.snoozeTimers.delete(entryKey);
      this.snoozedUntilMap.delete(entryKey);
      this.requestUpdate();
    }, delayMs + 50);
    this.snoozeTimers.set(entryKey, timerId);

    if (this.holdMenuKey === entryKey) {
      this.holdMenuKey = null;
    }
    this.requestUpdate();
  }

  private handleCancelHoldMenu(ev: Event): void {
    ev.stopPropagation();
    this.holdMenuKey = null;
  }

  private toggleKeypad(ev: Event): void {
    ev.stopPropagation();
    this.keypadOpen = !this.keypadOpen;
    if (!this.keypadOpen) {
      this.keypadCode = '';
      this.keypadFeedback = null;
    }
  }

  private appendKeypadDigit(digit: string): void {
    if (!/^\d$/.test(digit) || this.keypadCode.length >= 4) {
      return;
    }
    if (this.keypadFeedback?.type === 'error') {
      this.keypadFeedback = null;
    }
    this.keypadCode = `${this.keypadCode}${digit}`;
  }

  private backspaceKeypad(): void {
    if (this.keypadCode.length > 0) {
      this.keypadCode = this.keypadCode.slice(0, -1);
    }
  }

  private clearKeypadCode(): void {
    this.keypadCode = '';
    this.keypadFeedback = null;
  }

  private setKeypadFeedback(type: 'error' | 'success', text: string): void {
    window.clearTimeout(this.keypadFeedbackTimer);
    this.keypadFeedback = { type, text };
    this.keypadFeedbackTimer = window.setTimeout(() => {
      this.keypadFeedback = null;
    }, 2800);
  }

  private cancelArmDelay(feedbackText?: string): void {
    if (this.armDelayInterval !== undefined) {
      window.clearInterval(this.armDelayInterval);
      this.armDelayInterval = undefined;
    }
    this.armDelayRemaining = 0;
    if (feedbackText) {
      this.setKeypadFeedback('success', feedbackText);
    }
  }

  private async handleKeypadAction(mode: 'arm' | 'disarm'): Promise<void> {
    const keypadCfg = this.config?.default_alert?.keypad;

    if (mode === 'disarm') {
      const validPasscodes = (keypadCfg?.passcodes || [])
        .map((code) => String(code).replace(/\D/g, '').slice(0, 4))
        .filter((code) => code.length > 0);

      if (validPasscodes.length > 0 && !validPasscodes.includes(this.keypadCode)) {
        this.keypadCode = '';
        this.setKeypadFeedback('error', 'Invalid passcode');
        return;
      }

      if (this.armDelayRemaining > 0) {
        this.cancelArmDelay();
      }
    }

    const targetEntity = keypadCfg?.entity?.trim();
    if (!targetEntity) {
      this.keypadCode = '';
      this.setKeypadFeedback('error', 'Set target entity in card settings');
      return;
    }

    if (mode === 'arm') {
      if (this.armDelayRemaining > 0) {
        this.cancelArmDelay('Arming cancelled');
        return;
      }

      const armDelaySec = Math.max(0, Math.floor(Number(keypadCfg?.arm_delay || 0)));
      if (armDelaySec > 0) {
        this.keypadCode = '';
        this.keypadFeedback = null;
        this.armDelayRemaining = armDelaySec;
        this.armDelayInterval = window.setInterval(() => {
          if (this.armDelayRemaining <= 1) {
            this.cancelArmDelay();
            void this.executeKeypadService('arm', targetEntity, '');
          } else {
            this.armDelayRemaining -= 1;
          }
        }, 1000);
        return;
      }
    }

    await this.executeKeypadService(mode, targetEntity, this.keypadCode);
  }

  private async executeKeypadService(
    mode: 'arm' | 'disarm',
    targetEntity: string,
    enteredCode: string
  ): Promise<void> {
    const keypadCfg = this.config?.default_alert?.keypad;
    const armValue = keypadCfg?.arm_value?.trim() || 'armed';
    const disarmValue = keypadCfg?.disarm_value?.trim() || 'disarmed';
    const value = mode === 'arm' ? armValue : disarmValue;
    const domain = targetEntity.split('.')[0];

    try {
      if (domain === 'input_text' || domain === 'text') {
        await this.hass.callService(domain, 'set_value', {
          entity_id: targetEntity,
          value,
        });
      } else if (domain === 'input_select' || domain === 'select') {
        await this.hass.callService(domain, 'select_option', {
          entity_id: targetEntity,
          option: value,
        });
      } else if (domain === 'input_boolean' || domain === 'switch' || domain === 'light') {
        await this.hass.callService(domain, mode === 'arm' ? 'turn_on' : 'turn_off', {
          entity_id: targetEntity,
        });
      } else if (domain === 'lock') {
        await this.hass.callService('lock', mode === 'arm' ? 'lock' : 'unlock', {
          entity_id: targetEntity,
        });
      } else if (domain === 'alarm_control_panel') {
        await this.hass.callService(
          'alarm_control_panel',
          mode === 'arm' ? 'alarm_arm_away' : 'alarm_disarm',
          {
            entity_id: targetEntity,
            ...(enteredCode ? { code: enteredCode } : {}),
          }
        );
      } else {
        await this.hass.callService(domain, 'set_value', {
          entity_id: targetEntity,
          value,
        });
      }

      this.keypadCode = '';
      this.setKeypadFeedback('success', mode === 'arm' ? `Armed (${value})` : `Disarmed (${value})`);
    } catch {
      this.setKeypadFeedback('error', 'Failed to update entity');
    }
  }

  private renderKeypadDropdown() {
    const keypadCfg = this.config?.default_alert?.keypad;
    const targetEntity = keypadCfg?.entity?.trim();
    const currentEntityState = targetEntity ? this.hass?.states?.[targetEntity]?.state : undefined;
    const hasPasscodes = (keypadCfg?.passcodes || []).some((c) => String(c).trim().length > 0);
    const maskedDots = '•'.repeat(this.keypadCode.length);

    return html`
      <div
        class="keypad-dropdown"
        @pointerdown=${(ev: Event) => ev.stopPropagation()}
        @pointerup=${(ev: Event) => ev.stopPropagation()}
        @click=${(ev: Event) => ev.stopPropagation()}
      >
        <div class="keypad-status-bar">
          <div class="keypad-code-display ${this.keypadFeedback?.type === 'error' ? 'error' : ''}">
            ${this.keypadCode.length > 0
              ? html`<span class="keypad-dots">${maskedDots}</span>`
              : html`<span class="keypad-placeholder">
                  ${hasPasscodes ? 'Enter code to disarm' : 'No passcode required'}
                </span>`}
          </div>
          ${this.armDelayRemaining > 0
            ? html`
                <span class="keypad-feedback arming">
                  Arming in ${this.armDelayRemaining}s
                </span>
              `
            : this.keypadFeedback
              ? html`
                  <span class="keypad-feedback ${this.keypadFeedback.type}">
                    ${this.keypadFeedback.text}
                  </span>
                `
              : currentEntityState !== undefined
                ? html`<span class="keypad-entity-state">${currentEntityState}</span>`
                : nothing}
        </div>

        <div class="keypad-actions">
          <button
            type="button"
            class="keypad-action-btn keypad-arm-btn"
            @click=${() => void this.handleKeypadAction('arm')}
          >
            <ha-icon icon="mdi:shield-lock"></ha-icon>
            <span>${this.armDelayRemaining > 0 ? `Cancel (${this.armDelayRemaining}s)` : 'Arm'}</span>
          </button>
          <button
            type="button"
            class="keypad-action-btn keypad-disarm-btn"
            @click=${() => void this.handleKeypadAction('disarm')}
          >
            <ha-icon icon="mdi:shield-off"></ha-icon>
            <span>Disarm</span>
          </button>
        </div>

        <div class="keypad-grid">
          ${['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(
            (digit) => html`
              <button
                type="button"
                class="keypad-key"
                @click=${() => this.appendKeypadDigit(digit)}
              >
                ${digit}
              </button>
            `
          )}
          <button
            type="button"
            class="keypad-key keypad-key-secondary"
            title="Clear"
            @click=${() => this.clearKeypadCode()}
          >
            ✕
          </button>
          <button
            type="button"
            class="keypad-key"
            @click=${() => this.appendKeypadDigit('0')}
          >
            0
          </button>
          <button
            type="button"
            class="keypad-key keypad-key-secondary"
            title="Backspace"
            @click=${() => this.backspaceKeypad()}
          >
            ⌫
          </button>
        </div>
      </div>
    `;
  }

  protected render() {
    if (!this.hass || !this.config) return nothing;

    // Collect active and non-dismissed/non-snoozed (rule, entity) entries, then sort by Priority (P1 -> P2 -> P3 -> P4)
    const activeEntries: Array<{
      rule: AlertRule;
      index: number | null;
      entityId: string;
      key: string | null;
    }> = [];

    (this.config.alerts || []).forEach((rule, index) => {
      const entities = this.getMonitoredEntities(rule);
      for (const entityId of entities) {
        const key = this.getEntryKey(rule, index, entityId);
        if (this.isEntityEntryActive(rule, index, entityId) && !this.isEntrySuppressed(key)) {
          activeEntries.push({ rule, index, entityId, key });
        }
      }
    });

    activeEntries.sort((a, b) => {
      const rankA = PRIORITY_RANK[(a.rule.priority || 'P2').toUpperCase()] ?? 2;
      const rankB = PRIORITY_RANK[(b.rule.priority || 'P2').toUpperCase()] ?? 2;
      if (rankA !== rankB) return rankA - rankB;
      return (a.index ?? 0) - (b.index ?? 0);
    });

    let entriesToRender = activeEntries;

    if (entriesToRender.length === 0) {
      if (this.config.show_default_alert === false) return nothing;

      const defaultAlert = this.config.default_alert;
      entriesToRender = [
        {
          index: null,
          key: null,
          entityId: defaultAlert?.entity || '',
          rule: {
            entity: defaultAlert?.entity || '',
            state: '',
            template: defaultAlert?.template || 'SECURE',
            message: defaultAlert?.message || 'All Secured',
            icon: defaultAlert?.icon || 'mdi:shield-check',
            icon_color: defaultAlert?.icon_color,
          },
        },
      ];
    }

    return html`
      <div class="card-container">
        ${entriesToRender.map(({ rule, index, entityId, key }) => {
          const tpl = getTemplate(rule.template || rule.severity);
          const icon = rule.icon?.trim() || tpl.defaultIcon;
          const priority = index !== null ? (rule.priority || 'P2').toUpperCase() : null;
          const badgeText = priority ? `${priority} · ${tpl.name}` : tpl.name;
          const lastChanged = index !== null ? this.formatLastChanged(entityId) : null;
          const isHoldMenuOpen = key !== null && this.holdMenuKey === key;
          const isSecureDefault = index === null;
          const keypadCfg = this.config.default_alert?.keypad;
          const showKeypadButton =
            isSecureDefault && keypadCfg?.enabled !== false;
          const keypadEntityId = keypadCfg?.entity?.trim();
          const alarmStateRaw =
            isSecureDefault && keypadEntityId
              ? this.hass?.states?.[keypadEntityId]?.state
              : undefined;
          const armValue = (keypadCfg?.arm_value?.trim() || 'armed').toLowerCase();
          const isArmedState =
            alarmStateRaw !== undefined &&
            (alarmStateRaw.toLowerCase() === armValue ||
              alarmStateRaw.toLowerCase().startsWith('armed') ||
              alarmStateRaw.toLowerCase() === 'on' ||
              alarmStateRaw.toLowerCase() === 'locked');

          return html`
            <div class="banner-wrapper ${showKeypadButton && this.keypadOpen ? 'keypad-open' : ''}">
              <div
                class="banner template-${tpl.name.toLowerCase()}"
                style=${rule.icon_color ? `--custom-icon-color: ${rule.icon_color};` : ''}
                title=${index !== null ? 'Hold to Snooze or Dismiss' : ''}
                @pointerdown=${() => this.onBannerPointerDown(key)}
                @pointerup=${() => this.onBannerPointerUp(entityId, key)}
                @pointercancel=${() => this.onBannerPointerCancel()}
                @pointerleave=${() => this.onBannerPointerCancel()}
                @contextmenu=${(ev: Event) => this.onBannerContextMenu(ev, key)}
              >
                <div class="icon-wrap">
                  <ha-icon .icon="${icon}"></ha-icon>
                </div>
                <div class="content">
                  <div class="badge-row">
                    <span class="badge">${badgeText}</span>
                    ${lastChanged
                      ? html`
                          <span
                            class="last-changed-badge"
                            title="Last changed: ${lastChanged.full}"
                          >
                            🕒 ${lastChanged.relative}
                          </span>
                        `
                      : nothing}
                  </div>
                  <span class="message">${this.formatMessage(rule, entityId)}</span>
                </div>

                ${isSecureDefault && (showKeypadButton || this.armDelayRemaining > 0 || alarmStateRaw !== undefined)
                  ? html`
                      <div class="secure-right-controls">
                        ${this.armDelayRemaining > 0
                          ? html`
                              <span class="alarm-status-badge arming">
                                ⏳ Arming in ${this.armDelayRemaining}s
                              </span>
                            `
                          : alarmStateRaw !== undefined
                            ? html`
                                <span
                                  class="alarm-status-badge ${isArmedState ? 'armed' : 'disarmed'}"
                                >
                                  ${isArmedState ? '🔒' : '🔓'} ${alarmStateRaw}
                                </span>
                              `
                            : nothing}
                        ${showKeypadButton
                          ? html`
                              <button
                                type="button"
                                class="keypad-toggle-btn ${this.keypadOpen ? 'active' : ''}"
                                title=${this.keypadOpen ? 'Close Keypad' : 'Open Arm / Disarm Keypad'}
                                aria-label=${this.keypadOpen ? 'Close Keypad' : 'Open Arm / Disarm Keypad'}
                                aria-expanded=${this.keypadOpen ? 'true' : 'false'}
                                @pointerdown=${(ev: Event) => ev.stopPropagation()}
                                @pointerup=${(ev: Event) => ev.stopPropagation()}
                                @click=${(ev: Event) => this.toggleKeypad(ev)}
                              >
                                <ha-icon icon="mdi:dialpad"></ha-icon>
                              </button>
                            `
                          : nothing}
                      </div>
                    `
                  : nothing}

                ${isHoldMenuOpen && key
                  ? html`
                      <div
                        class="hold-menu-overlay"
                        @pointerdown=${(ev: Event) => ev.stopPropagation()}
                        @pointerup=${(ev: Event) => ev.stopPropagation()}
                        @click=${(ev: Event) => ev.stopPropagation()}
                      >
                        <span class="hold-menu-label">Alert Action:</span>
                        <div class="hold-menu-actions">
                          <button
                            type="button"
                            class="hold-btn hold-btn-snooze"
                            @click=${(ev: Event) => this.handleSnooze30m(key, ev)}
                          >
                            ⏱️ Snooze 30m
                          </button>
                          <button
                            type="button"
                            class="hold-btn hold-btn-dismiss"
                            @click=${(ev: Event) => this.handleDismiss(key, ev)}
                          >
                            ✕ Dismiss
                          </button>
                          <button
                            type="button"
                            class="hold-btn hold-btn-cancel"
                            @click=${(ev: Event) => this.handleCancelHoldMenu(ev)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    `
                  : nothing}

                <span class="bottom-ribbon" aria-hidden="true"></span>
              </div>

              ${showKeypadButton && this.keypadOpen ? this.renderKeypadDropdown() : nothing}
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

      .banner-wrapper.keypad-open:hover,
      .banner-wrapper.keypad-open:active {
        transform: none;
      }

      .secure-right-controls {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .keypad-toggle-btn {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--template-accent-color, #22c55e) 35%, transparent);
        background: color-mix(in srgb, var(--template-accent-color, #22c55e) 16%, var(--base-surface));
        color: var(--primary-text-color, #f8fafc);
        cursor: pointer;
        transition: transform 0.14s ease, background 0.16s ease, border-color 0.16s ease;
      }

      .keypad-toggle-btn ha-icon {
        --mdc-icon-size: 20px;
      }

      .keypad-toggle-btn:hover {
        background: color-mix(in srgb, var(--template-accent-color, #22c55e) 26%, var(--base-surface));
        border-color: color-mix(in srgb, var(--template-accent-color, #22c55e) 60%, transparent);
      }

      .keypad-toggle-btn:active {
        transform: scale(0.94);
      }

      .keypad-toggle-btn.active {
        background: color-mix(in srgb, var(--template-accent-color, #22c55e) 32%, var(--base-surface));
        border-color: var(--template-accent-color, #22c55e);
      }

      .keypad-dropdown {
        margin-top: 6px;
        padding: 14px;
        border-radius: var(--ha-card-border-radius, 12px);
        background: color-mix(in srgb, #22c55e 8%, var(--base-surface));
        border: 1px solid color-mix(in srgb, #22c55e 28%, rgba(255, 255, 255, 0.12));
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: keypadSlideDown 0.16s ease-out;
      }

      @keyframes keypadSlideDown {
        from {
          opacity: 0;
          transform: translateY(-6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .keypad-status-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-height: 24px;
      }

      .keypad-code-display {
        font-size: 1rem;
        font-weight: 700;
        color: var(--primary-text-color, #f8fafc);
        letter-spacing: 0.22em;
      }

      .keypad-code-display.error {
        animation: keypadShake 0.28s ease;
      }

      @keyframes keypadShake {
        0%,
        100% {
          transform: translateX(0);
        }
        25% {
          transform: translateX(-4px);
        }
        75% {
          transform: translateX(4px);
        }
      }

      .keypad-placeholder {
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--secondary-text-color, #94a3b8);
      }

      .keypad-feedback {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }

      .keypad-feedback.error {
        color: var(--error-color, #f87171);
      }

      .keypad-feedback.success {
        color: var(--success-color, #4ade80);
      }

      .keypad-feedback.arming {
        color: var(--warning-color, #fbbf24);
      }

      .alarm-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        border-radius: 4px;
        border: 1px solid transparent;
      }

      .alarm-status-badge.armed {
        color: var(--warning-color, #fbbf24);
        background: color-mix(in srgb, var(--warning-color, #f59e0b) 18%, var(--base-surface));
        border-color: color-mix(in srgb, var(--warning-color, #f59e0b) 42%, transparent);
      }

      .alarm-status-badge.disarmed {
        color: var(--success-color, #4ade80);
        background: color-mix(in srgb, var(--success-color, #22c55e) 16%, var(--base-surface));
        border-color: color-mix(in srgb, var(--success-color, #22c55e) 38%, transparent);
      }

      .alarm-status-badge.arming {
        color: var(--warning-color, #fbbf24);
        background: color-mix(in srgb, var(--warning-color, #f59e0b) 20%, var(--base-surface));
        border-color: color-mix(in srgb, var(--warning-color, #f59e0b) 45%, transparent);
      }

      .keypad-entity-state {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: var(--secondary-text-color, #cbd5e1);
      }

      .keypad-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .keypad-action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        border: 1px solid transparent;
        transition: filter 0.14s ease, transform 0.1s ease;
      }

      .keypad-action-btn ha-icon {
        --mdc-icon-size: 18px;
      }

      .keypad-action-btn:hover {
        filter: brightness(1.12);
      }

      .keypad-action-btn:active {
        transform: scale(0.97);
      }

      .keypad-arm-btn {
        background: color-mix(in srgb, var(--warning-color, #f59e0b) 22%, var(--base-surface));
        color: var(--warning-color, #fbbf24);
        border-color: color-mix(in srgb, var(--warning-color, #f59e0b) 48%, transparent);
      }

      .keypad-disarm-btn {
        background: color-mix(in srgb, var(--success-color, #22c55e) 22%, var(--base-surface));
        color: var(--success-color, #4ade80);
        border-color: color-mix(in srgb, var(--success-color, #22c55e) 48%, transparent);
      }

      .keypad-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .keypad-key {
        height: 42px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.06);
        color: var(--primary-text-color, #f8fafc);
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.12s ease, transform 0.1s ease;
      }

      .keypad-key:hover {
        background: rgba(255, 255, 255, 0.13);
      }

      .keypad-key:active {
        transform: scale(0.95);
      }

      .keypad-key-secondary {
        font-size: 0.9rem;
        color: var(--secondary-text-color, #cbd5e1);
        background: rgba(255, 255, 255, 0.03);
      }
    `,
  ];
}
