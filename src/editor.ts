import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import {
  AlertPriority,
  AlertRule,
  AlertSeverity,
  DefaultAlertConfig,
  DurationConfig,
  GuardianAlertsCardConfig,
  StateOperator,
} from './types';
import { getTemplate } from './templates';

interface HaFormSchemaItem {
  name: string;
  label?: string;
  helper?: string;
  required?: boolean;
  selector: Record<string, any>;
}

const PRIORITY_RANK: Record<string, number> = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
};

const PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1 — Highest Priority (Top of Alert List)' },
  { value: 'P2', label: 'P2 — High Priority' },
  { value: 'P3', label: 'P3 — Medium Priority' },
  { value: 'P4', label: 'P4 — Low Priority' },
];

const TEMPLATE_OPTIONS = [
  { value: 'SECURE', label: 'SECURE (Green — Static Shield)' },
  { value: 'INFO', label: 'INFO (Blue — Static)' },
  { value: 'WARNING', label: 'WARNING (Amber — Slow Flash)' },
  { value: 'CRITICAL', label: 'CRITICAL (Red — Slow Flash)' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equal (=) — Matches any selected state' },
  { value: 'not_equals', label: 'Not Equal (≠) — Does not match selected state(s)' },
];

const TAP_BEHAVIOR_OPTIONS = [
  { value: 'dismiss', label: 'Dismiss Alert (Remove from active alerts list)' },
  { value: 'snooze_30m', label: 'Snooze Alert for 30 Minutes' },
  { value: 'none', label: 'No Action' },
];

const DOMAIN_STATE_SUGGESTIONS: Record<string, string[]> = {
  binary_sensor: ['on', 'off', 'unavailable', 'unknown'],
  switch: ['on', 'off', 'unavailable'],
  light: ['on', 'off', 'unavailable'],
  input_boolean: ['on', 'off'],
  fan: ['on', 'off', 'unavailable'],
  alarm_control_panel: [
    'disarmed',
    'armed_home',
    'armed_away',
    'armed_night',
    'armed_vacation',
    'armed_custom_bypass',
    'pending',
    'arming',
    'triggered',
    'unavailable',
  ],
  lock: ['locked', 'unlocked', 'locking', 'unlocking', 'jammed', 'open', 'opening', 'unavailable'],
  cover: ['open', 'closed', 'opening', 'closing', 'stopped', 'unavailable'],
  person: ['home', 'not_home', 'unavailable'],
  device_tracker: ['home', 'not_home', 'unavailable'],
  media_player: ['playing', 'paused', 'idle', 'standby', 'off', 'on', 'buffering', 'unavailable'],
  climate: ['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only', 'unavailable'],
  weather: [
    'clear-night',
    'cloudy',
    'exceptional',
    'fog',
    'hail',
    'lightning',
    'lightning-rainy',
    'partlycloudy',
    'pouring',
    'rainy',
    'snowy',
    'snowy-rainy',
    'sunny',
    'windy',
    'windy-variant',
  ],
  sun: ['above_horizon', 'below_horizon'],
  vacuum: ['cleaning', 'docked', 'idle', 'paused', 'returning', 'error', 'unavailable'],
  water_heater: ['off', 'eco', 'electric', 'performance', 'high_demand', 'heat_pump', 'gas'],
};

@customElement('guardian-alerts-card-editor')
export class GuardianAlertsCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private config?: GuardianAlertsCardConfig;
  // Accordion state: only ONE rule can be open at a time (-1 = Default Rule, 0..N-1 = Alert Rule, null = all collapsed)
  @state() private expandedRuleIndex: number | null = 0;

  private defaultSchemaCache = new Map<boolean, HaFormSchemaItem[]>();
  private ruleSchemaCache = new Map<string, HaFormSchemaItem[]>();

  public connectedCallback(): void {
    super.connectedCallback();
    void this.ensureHaComponentsLoaded();
  }

  private async ensureHaComponentsLoaded(): Promise<void> {
    if (customElements.get('ha-form') && customElements.get('ha-entity-picker')) {
      return;
    }
    try {
      const loadCardHelpers = (window as any).loadCardHelpers;
      if (typeof loadCardHelpers === 'function') {
        const helpers = await loadCardHelpers();
        const card = await helpers.createCardElement({ type: 'entities', entities: [] });
        await card?.constructor?.getConfigElement?.();
        this.requestUpdate();
      }
    } catch {
      // Ignore if running outside Home Assistant
    }
  }

  public setConfig(config: GuardianAlertsCardConfig): void {
    const rawAlerts = Array.isArray(config?.alerts) ? config.alerts.map((r) => ({ ...r })) : [];
    this.config = {
      ...config,
      show_default_alert: config?.show_default_alert ?? true,
      default_alert: {
        template: 'SECURE',
        message: 'All Secured',
        icon: 'mdi:shield-check',
        ...(config?.default_alert || {}),
      },
      alerts: rawAlerts,
    };

    if (
      this.expandedRuleIndex !== null &&
      this.expandedRuleIndex >= 0 &&
      this.expandedRuleIndex >= rawAlerts.length
    ) {
      this.expandedRuleIndex = rawAlerts.length > 0 ? 0 : null;
    }
  }

  private toggleAccordion(index: number): void {
    this.expandedRuleIndex = this.expandedRuleIndex === index ? null : index;
  }

  private sortAlertsByPriority(
    alerts: AlertRule[],
    activeIndex?: number
  ): { sorted: AlertRule[]; newActiveIndex: number | null } {
    const tagged = alerts.map((rule, idx) => ({ rule, idx }));
    tagged.sort((a, b) => {
      const rankA = PRIORITY_RANK[(a.rule.priority || 'P2').toUpperCase()] ?? 2;
      const rankB = PRIORITY_RANK[(b.rule.priority || 'P2').toUpperCase()] ?? 2;
      if (rankA !== rankB) return rankA - rankB;
      return a.idx - b.idx;
    });

    const newActiveIndex =
      activeIndex !== undefined
        ? tagged.findIndex((item) => item.idx === activeIndex)
        : this.expandedRuleIndex;

    return {
      sorted: tagged.map((item) => item.rule),
      newActiveIndex: newActiveIndex !== -1 ? newActiveIndex : this.expandedRuleIndex,
    };
  }

  private emitConfigChanged(nextConfig: GuardianAlertsCardConfig): void {
    this.config = nextConfig;
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: nextConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  private computeLabel = (schema: HaFormSchemaItem): string => {
    return schema.label || schema.name;
  };

  private computeHelper = (schema: HaFormSchemaItem): string => {
    return schema.helper || '';
  };

  private normalizeRuleStates(rule: AlertRule): string[] {
    const raw: Array<string | number | boolean> = [];
    if (Array.isArray(rule.states)) {
      raw.push(...rule.states);
    }
    if (Array.isArray(rule.state)) {
      raw.push(...rule.state);
    } else if (rule.state !== undefined && rule.state !== null && String(rule.state).trim() !== '') {
      raw.push(rule.state);
    }
    return Array.from(
      new Set(
        raw
          .map((v) => String(v).trim())
          .filter((v) => v !== '')
      )
    );
  }

  private normalizeDurationObject(raw?: DurationConfig | number | string): DurationConfig {
    if (!raw) return { hours: 0, minutes: 0, seconds: 0 };
    if (typeof raw === 'number') {
      const totalSec = Math.max(0, Math.floor(raw));
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      return { hours, minutes, seconds };
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      const hmsMatch = trimmed.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
      if (hmsMatch) {
        const hasThree = hmsMatch[3] !== undefined;
        return {
          hours: hasThree ? Number(hmsMatch[1]) : 0,
          minutes: hasThree ? Number(hmsMatch[2]) : Number(hmsMatch[1]),
          seconds: hasThree ? Number(hmsMatch[3]) : Number(hmsMatch[2]),
        };
      }
      const numVal = Number(trimmed);
      if (!Number.isNaN(numVal) && numVal > 0) {
        return this.normalizeDurationObject(numVal);
      }
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    return {
      hours: Number(raw.hours || 0),
      minutes: Number(raw.minutes || 0),
      seconds: Number(raw.seconds || 0),
    };
  }

  private isZeroDuration(dur?: DurationConfig): boolean {
    if (!dur) return true;
    return (
      !Number(dur.days || 0) &&
      !Number(dur.hours || 0) &&
      !Number(dur.minutes || 0) &&
      !Number(dur.seconds || 0) &&
      !Number(dur.milliseconds || 0)
    );
  }

  private getTapBehaviorFromRule(rule: AlertRule): string {
    const act = rule.tap_action?.action;
    if (act === 'snooze' || act === 'snooze_30m' || act === 'delay_30m') return 'snooze_30m';
    if (act === 'none') return 'none';
    return 'dismiss';
  }

  private getStateOptionsForEntity(
    entityId: string | undefined,
    selectedStates: string[]
  ): Array<{ value: string; label: string }> {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string }> = [];

    const addOption = (val: string, label?: string) => {
      const clean = String(val).trim();
      if (!clean || seen.has(clean)) return;
      seen.add(clean);
      options.push({ value: clean, label: label || clean });
    };

    for (const s of selectedStates) {
      addOption(s);
    }

    const cleanEntity = (entityId || '').trim();
    const stateObj = cleanEntity ? this.hass?.states?.[cleanEntity] : undefined;
    if (stateObj) {
      if (stateObj.state !== undefined && stateObj.state !== null) {
        const cur = String(stateObj.state).trim();
        addOption(cur, `${cur} (Current State)`);
      }

      const attrs = stateObj.attributes || {};
      const attrLists = [
        attrs.options,
        attrs.hvac_modes,
        attrs.preset_modes,
        attrs.operation_list,
        attrs.fan_modes,
        attrs.swing_modes,
        attrs.effect_list,
        attrs.source_list,
      ];
      for (const list of attrLists) {
        if (Array.isArray(list)) {
          for (const item of list) {
            addOption(String(item));
          }
        }
      }
    }

    const domain = cleanEntity.includes('.') ? cleanEntity.split('.')[0] : '';
    if (domain && DOMAIN_STATE_SUGGESTIONS[domain]) {
      for (const s of DOMAIN_STATE_SUGGESTIONS[domain]) {
        addOption(s);
      }
    }

    if ((domain === 'person' || domain === 'device_tracker') && this.hass?.states) {
      for (const [id, st] of Object.entries(this.hass.states)) {
        if (id.startsWith('zone.') && st?.attributes?.friendly_name) {
          addOption(String(st.attributes.friendly_name));
        }
      }
    }

    for (const common of ['on', 'off', 'triggered', 'disarmed', 'open', 'closed', 'home', 'not_home', 'unavailable']) {
      addOption(common);
    }

    return options;
  }

  private getDefaultAlertSchema(showDefault: boolean): HaFormSchemaItem[] {
    const cached = this.defaultSchemaCache.get(showDefault);
    if (cached) return cached;

    const schema: HaFormSchemaItem[] = [
      {
        name: 'show_default_alert',
        label: 'Show "All Secured" banner when no alerts are active',
        selector: { boolean: {} },
      },
    ];

    if (showDefault) {
      schema.push(
        {
          name: 'message',
          label: 'Default Secured Message',
          selector: { text: {} },
        },
        {
          name: 'template',
          label: 'Default Banner Color / Template',
          selector: {
            select: {
              mode: 'dropdown',
              options: TEMPLATE_OPTIONS,
            },
          },
        },
        {
          name: 'icon',
          label: 'Default Shield Icon',
          selector: {
            icon: {
              placeholder: 'mdi:shield-check',
            },
          },
        },
        {
          name: 'entity',
          label: 'Optional Entity (for Tap More-Info)',
          selector: { entity: {} },
        }
      );
    }

    this.defaultSchemaCache.set(showDefault, schema);
    return schema;
  }

  private getRuleSchema(
    entityId: string | undefined,
    defaultIcon: string,
    selectedStates: string[],
    liveStateDisplay?: string
  ): HaFormSchemaItem[] {
    const cleanEntity = (entityId || '').trim();
    const stateOptions = this.getStateOptionsForEntity(cleanEntity, selectedStates);
    const optionsKey = stateOptions.map((o) => o.value).join('|');
    const cacheKey = `${cleanEntity}::${defaultIcon}::${liveStateDisplay || ''}::${optionsKey}`;
    const cached = this.ruleSchemaCache.get(cacheKey);
    if (cached) return cached;

    const stateLabel = liveStateDisplay
      ? `Trigger State(s) / Value(s) (Current: ${liveStateDisplay})`
      : 'Trigger State(s) / Value(s)';

    const schema: HaFormSchemaItem[] = [
      {
        name: 'priority',
        label: 'Priority Level (Reorders alerts: P1 first -> P4 last)',
        selector: {
          select: {
            mode: 'dropdown',
            options: PRIORITY_OPTIONS,
          },
        },
      },
      {
        name: 'template',
        label: 'Alert Template / Severity Color',
        selector: {
          select: {
            mode: 'dropdown',
            options: TEMPLATE_OPTIONS,
          },
        },
      },
      {
        name: 'entity',
        label: 'Entity (Search any sensor or entity)',
        required: true,
        selector: { entity: {} },
      },
      {
        name: 'operator',
        label: 'State Match Condition',
        selector: {
          select: {
            mode: 'dropdown',
            options: OPERATOR_OPTIONS,
          },
        },
      },
      {
        name: 'states',
        label: stateLabel,
        helper: 'Select one or more states, or type any custom value/text and press Enter',
        required: true,
        selector: {
          select: {
            multiple: true,
            custom_value: true,
            mode: 'dropdown',
            options: stateOptions,
          },
        },
      },
      {
        name: 'for',
        label: 'Time in State Before Alerting (hh:mm:ss)',
        helper: 'How long the entity must stay in the matching state before the alert shows (00:00:00 = immediately)',
        selector: {
          duration: {},
        },
      },
      {
        name: 'icon',
        label: `Icon (default: ${defaultIcon})`,
        selector: {
          icon: {
            placeholder: defaultIcon,
          },
        },
      },
      {
        name: 'message',
        label: 'Alert Message (Optional)',
        helper:
          'Supports {{ state }} and {{ entity }}. Leave empty to show "<entity name> is <state>".',
        selector: { text: {} },
      },
      {
        name: 'tap_behavior',
        label: 'On Tap Action',
        selector: {
          select: {
            mode: 'dropdown',
            options: TAP_BEHAVIOR_OPTIONS,
          },
        },
      },
    ];

    this.ruleSchemaCache.set(cacheKey, schema);
    return schema;
  }

  private onDefaultAlertFormChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this.config) return;
    const value = ev.detail?.value;
    if (!value) return;

    const showDefault = value.show_default_alert !== false;
    const nextDefaultAlert: DefaultAlertConfig = {
      ...(this.config.default_alert || {}),
      template: (value.template || 'SECURE') as AlertSeverity,
      message: value.message ?? 'All Secured',
      icon: value.icon || 'mdi:shield-check',
    };

    if (value.entity && value.entity.trim() !== '') {
      nextDefaultAlert.entity = value.entity.trim();
    } else {
      delete nextDefaultAlert.entity;
    }

    this.emitConfigChanged({
      ...this.config,
      type: this.config.type || 'custom:guardian-alerts-card',
      show_default_alert: showDefault,
      default_alert: nextDefaultAlert,
    });
  }

  private onRuleFormChanged(index: number, ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this.config) return;
    const value = ev.detail?.value;
    if (!value) return;

    const oldPriority = (this.config.alerts[index]?.priority || 'P2').toUpperCase();
    const newPriority = ((value.priority || oldPriority) as string).toUpperCase() as AlertPriority;

    const updatedAlerts = this.config.alerts.map((rule, i) => {
      if (i !== index) return rule;

      const selectedStates: string[] = Array.isArray(value.states)
        ? value.states.map((s: any) => String(s).trim()).filter(Boolean)
        : value.states !== undefined && String(value.states).trim() !== ''
          ? [String(value.states).trim()]
          : [];

      const updated: AlertRule = {
        ...rule,
        priority: newPriority,
        entity: value.entity ?? rule.entity ?? '',
        operator: (value.operator || rule.operator || 'equals') as StateOperator,
        state: selectedStates.length === 1 ? selectedStates[0] : selectedStates,
        template: ((value.template || rule.template || 'INFO') as string).toUpperCase() as AlertSeverity,
        message: value.message ?? rule.message ?? '',
      };

      delete updated.states;

      if (value.for && !this.isZeroDuration(value.for)) {
        updated.for = {
          hours: Number(value.for.hours || 0),
          minutes: Number(value.for.minutes || 0),
          seconds: Number(value.for.seconds || 0),
        };
      } else {
        delete updated.for;
        delete updated.duration;
      }

      if (value.icon && value.icon.trim() !== '') {
        updated.icon = value.icon.trim();
      } else {
        delete updated.icon;
      }

      const tapBehavior = value.tap_behavior || this.getTapBehaviorFromRule(rule);
      if (tapBehavior === 'snooze_30m') {
        updated.tap_action = { action: 'snooze_30m', snooze_minutes: 30 };
      } else if (tapBehavior === 'none') {
        updated.tap_action = { action: 'none' };
      } else {
        updated.tap_action = { action: 'dismiss' };
      }

      return updated;
    });

    // If priority changed, automatically reorder the rules list based on P1..P4 and keep this rule expanded
    let finalAlerts = updatedAlerts;
    if (newPriority !== oldPriority) {
      const { sorted, newActiveIndex } = this.sortAlertsByPriority(updatedAlerts, index);
      finalAlerts = sorted;
      this.expandedRuleIndex = newActiveIndex;
    }

    this.emitConfigChanged({
      ...this.config,
      type: this.config.type || 'custom:guardian-alerts-card',
      alerts: finalAlerts,
    });
  }

  private addRule(): void {
    if (!this.config) return;
    const existing = this.config.alerts || [];
    const newRule: AlertRule = {
      priority: 'P2',
      entity: '',
      state: [],
      operator: 'equals',
      template: 'WARNING',
      message: '',
      tap_action: { action: 'dismiss' },
    };

    const combined = [...existing, newRule];
    const { sorted, newActiveIndex } = this.sortAlertsByPriority(combined, combined.length - 1);
    this.expandedRuleIndex = newActiveIndex;

    this.emitConfigChanged({
      ...this.config,
      type: this.config.type || 'custom:guardian-alerts-card',
      alerts: sorted,
    });
  }

  private removeRule(index: number, ev: Event): void {
    ev.stopPropagation();
    if (!this.config) return;
    const nextAlerts = this.config.alerts.filter((_, i) => i !== index);
    if (this.expandedRuleIndex === index) {
      this.expandedRuleIndex = nextAlerts.length > 0 ? 0 : null;
    } else if (this.expandedRuleIndex !== null && this.expandedRuleIndex > index) {
      this.expandedRuleIndex -= 1;
    }
    this.emitConfigChanged({
      ...this.config,
      type: this.config.type || 'custom:guardian-alerts-card',
      alerts: nextAlerts,
    });
  }

  protected render() {
    if (!this.config) return nothing;

    const showDefault = this.config.show_default_alert !== false;
    const isDefaultOpen = this.expandedRuleIndex === -1;
    const defaultAlertData = {
      show_default_alert: showDefault,
      message: this.config.default_alert?.message ?? 'All Secured',
      template: (this.config.default_alert?.template || 'SECURE').toUpperCase(),
      icon: this.config.default_alert?.icon || 'mdi:shield-check',
      entity: this.config.default_alert?.entity || '',
    };

    return html`
      <div class="editor-container">
        <!-- Default "All Secured" Rule Card (Collapsible) -->
        <div class="rule-card secure-card">
          <div
            class="rule-header clickable"
            @click=${() => this.toggleAccordion(-1)}
          >
            <div class="rule-header-left">
              <span class="priority-pill priority-secure">DEFAULT</span>
              <span class="rule-title">
                🛡️ ${defaultAlertData.message || 'All Secured'} (${showDefault ? 'Enabled' : 'Disabled'})
              </span>
            </div>
            <div class="rule-header-actions">
              <button
                type="button"
                class="btn-collapse"
                title=${isDefaultOpen ? 'Collapse' : 'Expand'}
              >
                <span class="chevron ${isDefaultOpen ? 'open' : ''}">▼</span>
              </button>
            </div>
          </div>

          ${isDefaultOpen
            ? html`
                <div class="rule-body">
                  <ha-form
                    .hass=${this.hass}
                    .data=${defaultAlertData}
                    .schema=${this.getDefaultAlertSchema(showDefault)}
                    .computeLabel=${this.computeLabel}
                    .computeHelper=${this.computeHelper}
                    @value-changed=${(ev: CustomEvent) => this.onDefaultAlertFormChanged(ev)}
                  ></ha-form>
                </div>
              `
            : nothing}
        </div>

        <!-- Collapsible Alert Rules List (Only 1 open at a time) -->
        ${this.config.alerts.map((rule, index) => {
          const isOpen = this.expandedRuleIndex === index;
          const priority = (rule.priority || 'P2').toUpperCase();
          const tpl = getTemplate(rule.template || rule.severity);
          const selectedStates = this.normalizeRuleStates(rule);
          const tapBehavior = this.getTapBehaviorFromRule(rule);

          const entityStateObj = rule.entity ? this.hass?.states?.[rule.entity] : undefined;
          const unit = entityStateObj?.attributes?.unit_of_measurement;
          const liveStateDisplay =
            entityStateObj?.state !== undefined
              ? `${entityStateObj.state}${unit ? ` ${unit}` : ''}`
              : undefined;

          const ruleFormData = {
            priority,
            entity: rule.entity || '',
            operator: rule.operator || 'equals',
            states: selectedStates,
            for: this.normalizeDurationObject(rule.for ?? rule.duration),
            template: (rule.template || rule.severity || 'INFO').toUpperCase(),
            icon: rule.icon || '',
            message: rule.message || '',
            tap_behavior: tapBehavior,
          };

          return html`
            <div class="rule-card ${isOpen ? 'expanded' : 'collapsed'}">
              <div
                class="rule-header clickable"
                @click=${() => this.toggleAccordion(index)}
              >
                <div class="rule-header-left">
                  <span class="priority-pill priority-${priority.toLowerCase()}">${priority}</span>
                  <div class="rule-summary">
                    <span class="rule-title">
                      ${rule.message || `Alert Rule #${index + 1}`} (${tpl.name})
                    </span>
                    <span class="rule-subtitle">
                      ${rule.entity || 'No entity selected'}
                      ${selectedStates.length > 0 ? ` · [${selectedStates.join(', ')}]` : ''}
                    </span>
                  </div>
                </div>
                <div class="rule-header-actions">
                  <button
                    type="button"
                    class="btn-danger-sm"
                    title="Remove Rule"
                    @click=${(ev: Event) => this.removeRule(index, ev)}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    class="btn-collapse"
                    title=${isOpen ? 'Collapse rule' : 'Expand rule'}
                  >
                    <span class="chevron ${isOpen ? 'open' : ''}">▼</span>
                  </button>
                </div>
              </div>

              ${isOpen
                ? html`
                    <div class="rule-body">
                      <ha-form
                        .hass=${this.hass}
                        .data=${ruleFormData}
                        .schema=${this.getRuleSchema(
                          rule.entity,
                          tpl.defaultIcon,
                          selectedStates,
                          liveStateDisplay
                        )}
                        .computeLabel=${this.computeLabel}
                        .computeHelper=${this.computeHelper}
                        @value-changed=${(ev: CustomEvent) => this.onRuleFormChanged(index, ev)}
                      ></ha-form>
                    </div>
                  `
                : nothing}
            </div>
          `;
        })}

        <button type="button" class="btn-primary" @click=${() => this.addRule()}>
          + Add Alert Rule
        </button>
      </div>
    `;
  }

  static styles = css`
    .editor-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
      color: var(--primary-text-color, #f3f4f6);
    }

    .rule-card {
      background: var(--secondary-background-color, rgba(255, 255, 255, 0.04));
      border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
      border-radius: 12px;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }

    .rule-card.expanded {
      border-color: var(--primary-color, #38bdf8);
    }

    .secure-card {
      border-color: color-mix(
        in srgb,
        var(--success-color, #22c55e) 40%,
        var(--divider-color, rgba(255, 255, 255, 0.12))
      );
    }

    .rule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      user-select: none;
    }

    .rule-header.clickable {
      cursor: pointer;
    }

    .rule-header.clickable:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .rule-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }

    .rule-summary {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .rule-title {
      font-weight: 700;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rule-subtitle {
      font-size: 0.76rem;
      color: var(--secondary-text-color, #9ca3af);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rule-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .priority-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }

    .priority-p1 {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.45);
    }

    .priority-p2 {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.45);
    }

    .priority-p3 {
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.45);
    }

    .priority-p4 {
      background: rgba(148, 163, 184, 0.2);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.4);
    }

    .priority-secure {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.45);
    }

    .btn-collapse {
      background: rgba(255, 255, 255, 0.06);
      color: var(--primary-text-color, #f3f4f6);
      padding: 5px 9px;
      border-radius: 6px;
    }

    .chevron {
      display: inline-block;
      font-size: 0.75rem;
      transition: transform 0.2s ease;
    }

    .chevron.open {
      transform: rotate(180deg);
    }

    .rule-body {
      padding: 4px 16px 16px 16px;
      border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.08));
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    button {
      cursor: pointer;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 6px 12px;
      border: none;
    }

    .btn-primary {
      background: var(--primary-color, #0284c7);
      color: #fff;
      padding: 10px 16px;
      align-self: flex-start;
    }

    .btn-danger-sm {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      padding: 4px 10px;
    }
  `;
}
