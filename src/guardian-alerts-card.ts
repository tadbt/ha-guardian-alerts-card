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
  StateOperator,
} from './types';
import './editor';

export type {
  AlertPriority,
  AlertRule,
  ChimeType,
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
      'Origami-styled security & status alert banners with multi-entity monitoring, chime notifications, last-changed badge, and on-hold snooze/dismiss.',
    preview: true,
  });
}

@customElement('guardian-alerts-card')
export class GuardianAlertsCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: GuardianAlertsCardConfig;
  @state() private holdMenuKey: string | null = null;

  private holdTimeout?: number;
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
    // Refresh relative "last changed" badges every 30s
    this.relativeTimeInterval = window.setInterval(() => {
      this.requestUpdate();
    }, 30_000);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.relativeTimeInterval !== undefined) {
      window.clearInterval(this.relativeTimeInterval);
      this.relativeTimeInterval = undefined;
    }
    this.clearAllTimers();
  }

  private clearAllTimers(): void {
    window.clearTimeout(this.holdTimeout);
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
    this.activeEntryKeys.clear();
    this.matchedSinceMap.clear();
    this.dismissedEntryKeys.clear();
    this.snoozedUntilMap.clear();
    this.hasInitializedStates = false;
  }

  private getMonitoredEntities(rule: AlertRule): string[] {
    const raw: string[] = [];
    if (Array.isArray(rule.entities)) {
      for (const e of rule.entities) {
        if (typeof e === 'string' && e.trim() !== '') {
          raw.push(e.trim());
        }
      }
    }
    if (typeof rule.entity === 'string' && rule.entity.trim() !== '') {
      raw.push(rule.entity.trim());
    }
    return Array.from(new Set(raw));
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

    if (operator === 'contains') {
      return targets.some((expected) =>
        this.matchesSingleExpected(actualRaw, expected, 'contains')
      );
    }

    return targets.some((expected) => this.matchesSingleExpected(actualRaw, expected, 'equals'));
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

    let matchedSince = this.matchedSinceMap.get(entryKey);
    if (matchedSince === undefined) {
      const stateObj = this.hass?.states?.[entityId];
      const lastChangedMs = stateObj?.last_changed ? Date.parse(stateObj.last_changed) : NaN;
      if (!this.hasInitializedStates && !Number.isNaN(lastChangedMs) && lastChangedMs <= Date.now()) {
        matchedSince = lastChangedMs;
      } else if (!Number.isNaN(lastChangedMs) && Math.abs(Date.now() - lastChangedMs) < 2000) {
        matchedSince = lastChangedMs;
      } else {
        matchedSince = Date.now();
      }
      this.matchedSinceMap.set(entryKey, matchedSince);
    }

    const elapsedMs = Date.now() - matchedSince;
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

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
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

          return html`
            <div class="banner-wrapper">
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
