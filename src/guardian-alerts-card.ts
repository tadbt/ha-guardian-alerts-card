import { LitElement, PropertyValues, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { ActionConfig, ActionOrServiceInput, baseCardStyles, getTemplate } from './templates';
import { executeAction } from './utils/action-handler';
import {
  AlertPriority,
  AlertRule,
  AlertSeverity,
  GuardianAlertsCardConfig,
  ScriptDecisionResponse,
} from './types';
import './editor';

export type {
  AlertPriority,
  AlertRule,
  AlertSeverity,
  GuardianAlertsCardConfig,
  ScriptDecisionResponse,
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
      'Origami-styled security & status alert banners powered by Home Assistant scripts and entity triggers.',
    preview: true,
  });
}

@customElement('guardian-alerts-card')
export class GuardianAlertsCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: GuardianAlertsCardConfig;

  private holdTimeout?: number;
  private isHolding = false;
  private lastEvaluatedSnapshot = new Map<string, string>();
  private scriptResults = new Map<string, ScriptDecisionResponse>();
  private dismissedRuleKeys = new Set<string>();
  private snoozedUntilMap = new Map<string, number>();
  private snoozeTimers = new Map<string, number>();

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearAllTimers();
  }

  private clearAllTimers(): void {
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
          script: '',
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
    this.lastEvaluatedSnapshot.clear();
    this.scriptResults.clear();
    this.dismissedRuleKeys.clear();
    this.snoozedUntilMap.clear();
  }

  private getWatchedEntities(rule: AlertRule): string[] {
    const raw: string[] = [];
    if (typeof rule.entity === 'string' && rule.entity.trim() !== '') {
      raw.push(rule.entity.trim());
    }
    if (Array.isArray(rule.entities)) {
      for (const item of rule.entities) {
        if (typeof item === 'string' && item.trim() !== '') {
          raw.push(item.trim());
        }
      }
    }
    return Array.from(new Set(raw));
  }

  private getPrimaryEntity(rule: AlertRule): string {
    if (typeof rule.entity === 'string' && rule.entity.trim() !== '') {
      return rule.entity.trim();
    }
    const watched = this.getWatchedEntities(rule);
    return watched[0] || '';
  }

  private getTargetStates(rule: AlertRule): string[] {
    const rawList: Array<string | number | boolean> = [];
    if (Array.isArray(rule.states)) {
      rawList.push(...rule.states);
    }
    if (Array.isArray(rule.state)) {
      rawList.push(...rule.state);
    } else if (
      rule.state !== undefined &&
      rule.state !== null &&
      String(rule.state).trim() !== ''
    ) {
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

  private getRuleKey(rule: AlertRule, index: number): string {
    const watchedKey = this.getWatchedEntities(rule).join(',');
    const statesKey = this.getTargetStates(rule)
      .map((s) => s.toLowerCase())
      .join('|');
    const scriptKey = (rule.script || '').trim();
    return `${index}::${watchedKey}::${statesKey}::${scriptKey}`;
  }

  private getWatchedStateSnapshot(rule: AlertRule): string {
    const watched = this.getWatchedEntities(rule);
    return watched
      .map((id) => {
        const st = this.hass?.states?.[id]?.state;
        return `${id}=${st !== undefined && st !== null ? String(st).trim() : '__missing__'}`;
      })
      .join('||');
  }

  private matchesExpectedState(actualRaw: string, expectedRaw: string): boolean {
    const actualNum = Number(actualRaw);
    const expectedNum = Number(expectedRaw);
    if (actualRaw !== '' && !Number.isNaN(actualNum) && !Number.isNaN(expectedNum)) {
      return actualNum === expectedNum;
    }
    return actualRaw.toLowerCase() === expectedRaw.toLowerCase();
  }

  private doesEntityMatchTargets(entityId: string, targets: string[]): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj || stateObj.state === undefined || stateObj.state === null) return false;
    const actualRaw = String(stateObj.state).trim();
    return targets.some((expected) => this.matchesExpectedState(actualRaw, expected));
  }

  private doesTriggerMatch(rule: AlertRule): boolean {
    const watched = this.getWatchedEntities(rule);
    if (watched.length === 0) return false;

    const targets = this.getTargetStates(rule);
    const hasScript = Boolean(rule.script && rule.script.trim() !== '');

    // If no target state is specified, a script-backed rule triggers on any state change of its watched entities
    if (targets.length === 0) {
      if (!hasScript) return false;
      return watched.some((id) => this.hass?.states?.[id] !== undefined);
    }

    // If a primary entity is set, check its state against targets; otherwise check any watched entity
    const primary = typeof rule.entity === 'string' && rule.entity.trim() !== '' ? rule.entity.trim() : '';
    if (primary) {
      return this.doesEntityMatchTargets(primary, targets);
    }
    return watched.some((id) => this.doesEntityMatchTargets(id, targets));
  }

  private normalizeScriptResponse(
    rawResponse: any,
    rule: AlertRule
  ): ScriptDecisionResponse {
    if (typeof rawResponse === 'string') {
      const msg = rawResponse.trim();
      return {
        active: msg.length > 0,
        message: msg,
      };
    }

    if (rawResponse && typeof rawResponse === 'object') {
      // Unwrap nested service response if keyed by script name or `result`
      let payload = rawResponse;
      if (
        payload.message === undefined &&
        payload.active === undefined &&
        payload.result &&
        typeof payload.result === 'object'
      ) {
        payload = payload.result;
      }

      const rawMsg =
        typeof payload.message === 'string' ? payload.message.trim() : undefined;
      const explicitActive =
        typeof payload.active === 'boolean' ? payload.active : undefined;

      let active = false;
      let message = '';

      if (explicitActive === false) {
        active = false;
      } else if (rawMsg !== undefined) {
        active = rawMsg.length > 0;
        message = rawMsg;
      } else if (explicitActive === true) {
        active = true;
        message = rule.message || '';
      }

      return {
        active,
        message,
        template: (payload.template || payload.severity) as AlertSeverity | undefined,
        priority: payload.priority as AlertPriority | undefined,
        icon: typeof payload.icon === 'string' ? payload.icon : undefined,
        icon_color: typeof payload.icon_color === 'string' ? payload.icon_color : undefined,
      };
    }

    return { active: false, message: '' };
  }

  private async runDecisionScript(
    rule: AlertRule,
    ruleKey: string,
    snapshot: string
  ): Promise<void> {
    const rawScript = (rule.script || '').trim();
    if (!rawScript || !this.hass) return;

    const scriptService = rawScript.startsWith('script.')
      ? rawScript.slice('script.'.length)
      : rawScript;

    const primaryEntity = this.getPrimaryEntity(rule);
    const primaryState = primaryEntity
      ? String(this.hass?.states?.[primaryEntity]?.state ?? '')
      : '';
    const watchedEntities = this.getWatchedEntities(rule);
    const statesMap: Record<string, string> = {};
    for (const id of watchedEntities) {
      statesMap[id] = String(this.hass?.states?.[id]?.state ?? '');
    }

    const serviceData: Record<string, any> = {
      ...(rule.script_data || {}),
      entity: primaryEntity,
      state: primaryState,
      entities: watchedEntities,
      states: statesMap,
    };

    try {
      let rawResponse: any;
      if (typeof (this.hass as any).callWS === 'function') {
        const wsRes = await (this.hass as any).callWS({
          type: 'call_service',
          domain: 'script',
          service: scriptService,
          service_data: serviceData,
          return_response: true,
        });
        rawResponse = wsRes?.response ?? wsRes;
      } else if (typeof this.hass.callService === 'function') {
        rawResponse = await this.hass.callService('script', scriptService, serviceData);
      }

      // Ignore stale responses if the entity state changed while the script was running
      if (this.lastEvaluatedSnapshot.get(ruleKey) !== snapshot) {
        return;
      }

      const decision = this.normalizeScriptResponse(rawResponse, rule);
      this.scriptResults.set(ruleKey, decision);

      if (!decision.active) {
        this.dismissedRuleKeys.delete(ruleKey);
        this.clearSnoozeForRule(ruleKey);
      }

      this.requestUpdate();
    } catch (err) {
      console.warn(
        `[guardian-alerts-card] Failed to execute decision script "${rawScript}":`,
        err
      );
      if (this.lastEvaluatedSnapshot.get(ruleKey) === snapshot) {
        this.scriptResults.set(ruleKey, { active: false, message: '' });
        this.requestUpdate();
      }
    }
  }

  private evaluateRules(): void {
    if (!this.hass || !this.config) return;

    (this.config.alerts || []).forEach((rule, index) => {
      const key = this.getRuleKey(rule, index);
      const triggerMatched = this.doesTriggerMatch(rule);

      if (!triggerMatched) {
        this.lastEvaluatedSnapshot.delete(key);
        this.scriptResults.delete(key);
        this.dismissedRuleKeys.delete(key);
        this.clearSnoozeForRule(key);
        return;
      }

      const hasScript = Boolean(rule.script && rule.script.trim() !== '');
      if (hasScript) {
        const snapshot = this.getWatchedStateSnapshot(rule);
        if (this.lastEvaluatedSnapshot.get(key) !== snapshot) {
          this.lastEvaluatedSnapshot.set(key, snapshot);
          void this.runDecisionScript(rule, key, snapshot);
        }
      }
    });
  }

  private resolveActiveRule(
    rule: AlertRule,
    index: number
  ): { active: boolean; effectiveRule: AlertRule } {
    const key = this.getRuleKey(rule, index);
    if (!this.doesTriggerMatch(rule)) {
      return { active: false, effectiveRule: rule };
    }

    const hasScript = Boolean(rule.script && rule.script.trim() !== '');
    if (!hasScript) {
      const msg = this.formatMessage(rule, rule.message || '').trim();
      return {
        active: msg.length > 0,
        effectiveRule: {
          ...rule,
          message: msg,
        },
      };
    }

    const decision = this.scriptResults.get(key);
    if (!decision || !decision.active) {
      return { active: false, effectiveRule: rule };
    }

    const resolvedMessage = this.formatMessage(
      rule,
      decision.message || rule.message || ''
    ).trim();
    if (!resolvedMessage) {
      return { active: false, effectiveRule: rule };
    }

    return {
      active: true,
      effectiveRule: {
        ...rule,
        message: resolvedMessage,
        template: decision.template || rule.template || rule.severity,
        priority: decision.priority || rule.priority,
        icon: decision.icon || rule.icon,
        icon_color: decision.icon_color || rule.icon_color,
      },
    };
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

  private formatMessage(rule: AlertRule, rawMsg = rule.message || ''): string {
    const primaryEntity = this.getPrimaryEntity(rule);
    if (!primaryEntity) return rawMsg;
    const stateObj = this.hass?.states?.[primaryEntity];
    const currentVal = stateObj?.state ?? '';
    return rawMsg
      .replace(/\{\{\s*state\s*\}\}/g, String(currentVal))
      .replace(/\{\{\s*entity\s*\}\}/g, primaryEntity);
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this.hass || !this.config) return;

    if (changedProps.has('hass') || changedProps.has('config')) {
      this.evaluateRules();
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
      const originalRule = this.config.alerts[index] || rule;
      const ruleKey = this.getRuleKey(originalRule, index);

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
      defaultEntity: this.getPrimaryEntity(rule),
      defaultMessage: rule.message || '',
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
      .map((rule, index) => {
        const key = this.getRuleKey(rule, index);
        const { active, effectiveRule } = this.resolveActiveRule(rule, index);
        return { rule: effectiveRule, index, key, active };
      })
      .filter(({ active, key }) => active && !this.isRuleSuppressed(key))
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
      const fallbackEntity =
        defaultAlert?.entity ||
        (this.config.alerts?.[0] ? this.getPrimaryEntity(this.config.alerts[0]) : '');

      entriesToRender = [
        {
          index: null,
          rule: {
            entity: fallbackEntity,
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
                  <span class="message">${rule.message || ''}</span>
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
