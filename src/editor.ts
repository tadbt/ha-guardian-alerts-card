import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import {
  AlertRule,
  AlertSeverity,
  DefaultAlertConfig,
  DurationConfig,
  GuardianAlertsCardConfig,
  StateOperator,
} from './types';
import { ActionConfig, getTemplate, ServiceCallConfig } from './templates';

interface HaFormSchemaItem {
  name: string;
  label?: string;
  helper?: string;
  required?: boolean;
  selector: Record<string, any>;
}

const TEMPLATE_OPTIONS = [
  { value: 'SECURE', label: 'SECURE (Green — Static Shield)' },
  { value: 'INFO', label: 'INFO (Blue — Static)' },
  { value: 'WARNING', label: 'WARNING (Amber — Slow Flash)' },
  { value: 'CRITICAL', label: 'CRITICAL (Red — Slow Flash)' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equal (=) — Matches any selected state' },
  { value: 'not_equals', label: 'Not Equal (≠) — Does not match selected state(s)' },
  { value: 'contains', label: 'Contains — State contains any selected value' },
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

  private defaultSchemaCache = new Map<boolean, HaFormSchemaItem[]>();
  private ruleSchemaCache = new Map<string, HaFormSchemaItem[]>();
  private serviceSchemaCache = new Map<string, HaFormSchemaItem[]>();
  private cachedServicesRef?: HomeAssistant['services'];
  private cachedServiceOptions: Array<{ value: string; label: string }> = [];

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
    this.config = {
      ...config,
      show_default_alert: config?.show_default_alert ?? true,
      default_alert: {
        template: 'SECURE',
        message: 'All Secured',
        icon: 'mdi:shield-check',
        ...(config?.default_alert || {}),
      },
      alerts: Array.isArray(config?.alerts) ? config.alerts.map((r) => ({ ...r })) : [],
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

    // 1. Include any already-selected custom states first so their chips always render labels
    for (const s of selectedStates) {
      addOption(s);
    }

    // 2. Inspect entity's live state and attributes in hass
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

    // 3. Domain-specific state suggestions
    const domain = cleanEntity.includes('.') ? cleanEntity.split('.')[0] : '';
    if (domain && DOMAIN_STATE_SUGGESTIONS[domain]) {
      for (const s of DOMAIN_STATE_SUGGESTIONS[domain]) {
        addOption(s);
      }
    }

    // For person / device_tracker, also add configured zone friendly names
    if ((domain === 'person' || domain === 'device_tracker') && this.hass?.states) {
      for (const [id, st] of Object.entries(this.hass.states)) {
        if (id.startsWith('zone.') && st?.attributes?.friendly_name) {
          addOption(String(st.attributes.friendly_name));
        }
      }
    }

    // 4. General common states fallback
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
        label: 'Duration in State Before Triggering (hh:mm:ss)',
        helper: 'How long the entity must stay in the matching state to trigger (00:00:00 = immediate)',
        selector: {
          duration: {},
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
        label: 'Alert Message (supports {{ state }} and {{ entity }})',
        required: true,
        selector: { text: {} },
      },
      {
        name: 'tap_action',
        label: 'Tap Action',
        selector: {
          ui_action: {
            default_action: 'more-info',
          },
        },
      },
    ];

    this.ruleSchemaCache.set(cacheKey, schema);
    return schema;
  }

  private getServiceOptions(): Array<{ value: string; label: string }> {
    const servicesObj = this.hass?.services;
    if (servicesObj && servicesObj === this.cachedServicesRef && this.cachedServiceOptions.length > 0) {
      return this.cachedServiceOptions;
    }

    const options: Array<{ value: string; label: string }> = [];
    if (servicesObj) {
      for (const [domain, domainServices] of Object.entries(servicesObj)) {
        for (const [serviceName, meta] of Object.entries(domainServices || {})) {
          const serviceId = `${domain}.${serviceName}`;
          const friendly = (meta as any)?.name;
          options.push({
            value: serviceId,
            label: friendly ? `${serviceId} — ${friendly}` : serviceId,
          });
        }
      }
      options.sort((a, b) => a.value.localeCompare(b.value));
    } else {
      options.push(
        { value: 'scene.turn_on', label: 'scene.turn_on — Activate Scene' },
        { value: 'script.turn_on', label: 'script.turn_on — Run Script' },
        { value: 'script.tts_announce', label: 'script.tts_announce — TTS Announce Script' },
        { value: 'light.turn_on', label: 'light.turn_on — Turn On Light' },
        { value: 'light.turn_off', label: 'light.turn_off — Turn Off Light' },
        { value: 'input_boolean.toggle', label: 'input_boolean.toggle — Toggle Input Boolean' },
        { value: 'notify.notify', label: 'notify.notify — Send Notification' }
      );
    }

    this.cachedServicesRef = servicesObj;
    this.cachedServiceOptions = options;
    this.serviceSchemaCache.clear();
    return options;
  }

  private getServiceCallSchema(currentService?: string): HaFormSchemaItem[] {
    const baseOptions = this.getServiceOptions();
    const svcVal = (currentService || '').trim();
    const cacheKey = `${baseOptions.length}::${svcVal}`;
    const cached = this.serviceSchemaCache.get(cacheKey);
    if (cached) return cached;

    const options =
      svcVal && !baseOptions.some((o) => o.value === svcVal)
        ? [{ value: svcVal, label: svcVal }, ...baseOptions]
        : baseOptions;

    const schema: HaFormSchemaItem[] = [
      {
        name: 'service',
        label: 'Service Call (search domain.service)',
        selector: {
          select: {
            mode: 'dropdown',
            custom_value: true,
            options,
          },
        },
      },
      {
        name: 'target',
        label: 'Target (Search Entities, Devices, or Areas)',
        selector: {
          target: {},
        },
      },
      {
        name: 'message',
        label: 'Message Parameter (optional, supports {{ message }} & {{ entity }})',
        selector: { text: {} },
      },
    ];

    this.serviceSchemaCache.set(cacheKey, schema);
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

    const nextAlerts = this.config.alerts.map((rule, i) => {
      if (i !== index) return rule;

      const selectedStates: string[] = Array.isArray(value.states)
        ? value.states.map((s: any) => String(s).trim()).filter(Boolean)
        : value.states !== undefined && String(value.states).trim() !== ''
          ? [String(value.states).trim()]
          : [];

      const updated: AlertRule = {
        ...rule,
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

      if (value.tap_action && !Array.isArray(rule.tap_action)) {
        updated.tap_action = value.tap_action as ActionConfig;
      }

      return updated;
    });

    this.emitConfigChanged({
      ...this.config,
      type: this.config.type || 'custom:guardian-alerts-card',
      alerts: nextAlerts,
    });
  }

  private addRule(): void {
    if (!this.config) return;
    const existing = this.config.alerts || [];

    this.emitConfigChanged({
      ...this.config,
      type: this.config.type || 'custom:guardian-alerts-card',
      alerts: [
        ...existing,
        {
          entity: '',
          state: [],
          operator: 'equals',
          template: 'WARNING',
          message: 'New Guardian Alert',
        },
      ],
    });
  }

  private removeRule(index: number): void {
    if (!this.config) return;
    const nextAlerts = this.config.alerts.filter((_, i) => i !== index);
    this.emitConfigChanged({
      ...this.config,
      type: this.config.type || 'custom:guardian-alerts-card',
      alerts: nextAlerts,
    });
  }

  private normalizeOnActiveList(rule: AlertRule): ServiceCallConfig[] {
    if (!rule.on_active) return [];
    if (Array.isArray(rule.on_active)) {
      return rule.on_active.map((item) => ({
        service: item.service || item.perform_action || '',
        target: item.target,
        service_data: item.service_data ?? item.data,
      }));
    }
    const single = rule.on_active as ServiceCallConfig;
    if (single.service || single.perform_action) {
      return [
        {
          service: single.service || single.perform_action || '',
          target: single.target,
          service_data: single.service_data ?? single.data,
        },
      ];
    }
    return [];
  }

  private addOnActiveService(ruleIndex: number): void {
    if (!this.config) return;
    const rule = this.config.alerts[ruleIndex];
    const current = this.normalizeOnActiveList(rule);
    const nextAlerts = this.config.alerts.map((r, i) =>
      i === ruleIndex
        ? {
            ...r,
            on_active: [
              ...current,
              {
                service: 'scene.turn_on',
              },
            ],
          }
        : r
    );
    this.emitConfigChanged({
      ...this.config,
      alerts: nextAlerts,
    });
  }

  private onServiceCallFormChanged(
    ruleIndex: number,
    serviceIndex: number,
    ev: CustomEvent
  ): void {
    ev.stopPropagation();
    if (!this.config) return;
    const value = ev.detail?.value;
    if (!value) return;

    const rule = this.config.alerts[ruleIndex];
    const list = this.normalizeOnActiveList(rule).map((svc, idx) => {
      if (idx !== serviceIndex) return svc;
      const next: ServiceCallConfig = {
        ...svc,
        service: value.service ?? svc.service ?? '',
      };

      const targetObj = value.target;
      if (
        targetObj &&
        typeof targetObj === 'object' &&
        Object.keys(targetObj).some((k) => {
          const v = targetObj[k];
          return Array.isArray(v) ? v.length > 0 : Boolean(v);
        })
      ) {
        next.target = targetObj;
      } else {
        delete next.target;
      }

      const currentData = { ...(next.service_data || {}) };
      if (typeof value.message === 'string' && value.message.trim() !== '') {
        currentData.message = value.message;
        next.service_data = currentData;
      } else {
        delete currentData.message;
        next.service_data = Object.keys(currentData).length > 0 ? currentData : undefined;
      }

      return next;
    });

    const nextAlerts = this.config.alerts.map((r, i) =>
      i === ruleIndex ? { ...r, on_active: list.length > 0 ? list : undefined } : r
    );
    this.emitConfigChanged({
      ...this.config,
      alerts: nextAlerts,
    });
  }

  private removeOnActiveService(ruleIndex: number, serviceIndex: number): void {
    if (!this.config) return;
    const rule = this.config.alerts[ruleIndex];
    const list = this.normalizeOnActiveList(rule).filter((_, idx) => idx !== serviceIndex);
    const nextAlerts = this.config.alerts.map((r, i) =>
      i === ruleIndex ? { ...r, on_active: list.length > 0 ? list : undefined } : r
    );
    this.emitConfigChanged({
      ...this.config,
      alerts: nextAlerts,
    });
  }

  protected render() {
    if (!this.config) return nothing;

    const showDefault = this.config.show_default_alert !== false;
    const defaultAlertData = {
      show_default_alert: showDefault,
      message: this.config.default_alert?.message ?? 'All Secured',
      template: (this.config.default_alert?.template || 'SECURE').toUpperCase(),
      icon: this.config.default_alert?.icon || 'mdi:shield-check',
      entity: this.config.default_alert?.entity || '',
    };

    return html`
      <div class="editor-container">
        <!-- Default "All Secured" Banner Section -->
        <div class="rule-card secure-card">
          <div class="rule-header">
            <span class="rule-title">🛡️ Default Rule (When All Secured)</span>
          </div>
          <ha-form
            .hass=${this.hass}
            .data=${defaultAlertData}
            .schema=${this.getDefaultAlertSchema(showDefault)}
            .computeLabel=${this.computeLabel}
            .computeHelper=${this.computeHelper}
            @value-changed=${(ev: CustomEvent) => this.onDefaultAlertFormChanged(ev)}
          ></ha-form>
        </div>

        <!-- Alert Rules Section -->
        ${this.config.alerts.map((rule, index) => {
          const tpl = getTemplate(rule.template || rule.severity);
          const services = this.normalizeOnActiveList(rule);
          const selectedStates = this.normalizeRuleStates(rule);
          const entityStateObj = rule.entity ? this.hass?.states?.[rule.entity] : undefined;
          const unit = entityStateObj?.attributes?.unit_of_measurement;
          const liveStateDisplay =
            entityStateObj?.state !== undefined
              ? `${entityStateObj.state}${unit ? ` ${unit}` : ''}`
              : undefined;

          const ruleFormData = {
            entity: rule.entity || '',
            operator: rule.operator || 'equals',
            states: selectedStates,
            for: this.normalizeDurationObject(rule.for ?? rule.duration),
            template: (rule.template || rule.severity || 'INFO').toUpperCase(),
            icon: rule.icon || '',
            message: rule.message || '',
            tap_action: !Array.isArray(rule.tap_action)
              ? rule.tap_action || { action: 'more-info' }
              : { action: 'more-info' },
          };

          return html`
            <div class="rule-card">
              <div class="rule-header">
                <span class="rule-title">Alert Rule #${index + 1} (${tpl.name})</span>
                <button
                  type="button"
                  class="btn-danger"
                  @click=${() => this.removeRule(index)}
                >
                  Remove Rule
                </button>
              </div>

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

              <div class="services-section">
                <div class="services-header">
                  <span>On-Active Service Calls (${services.length})</span>
                  <button
                    type="button"
                    class="btn-secondary"
                    @click=${() => this.addOnActiveService(index)}
                  >
                    + Add Service Call
                  </button>
                </div>

                ${services.map((svc, sIdx) => {
                  const svcFormData = {
                    service: svc.service || '',
                    target: svc.target || {},
                    message: svc.service_data?.message ?? '',
                  };

                  return html`
                    <div class="service-card">
                      <div class="service-card-header">
                        <span>Service Call #${sIdx + 1}</span>
                        <button
                          type="button"
                          class="btn-danger-sm"
                          title="Remove Service Call"
                          @click=${() => this.removeOnActiveService(index, sIdx)}
                        >
                          Remove
                        </button>
                      </div>
                      <ha-form
                        .hass=${this.hass}
                        .data=${svcFormData}
                        .schema=${this.getServiceCallSchema(svc.service)}
                        .computeLabel=${this.computeLabel}
                        .computeHelper=${this.computeHelper}
                        @value-changed=${(ev: CustomEvent) =>
                          this.onServiceCallFormChanged(index, sIdx, ev)}
                      ></ha-form>
                    </div>
                  `;
                })}
              </div>
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
      gap: 16px;
      padding: 8px 0;
      color: var(--primary-text-color, #f3f4f6);
    }

    .rule-card {
      background: var(--secondary-background-color, rgba(255, 255, 255, 0.04));
      border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .secure-card {
      border-color: color-mix(in srgb, var(--success-color, #22c55e) 40%, var(--divider-color, rgba(255, 255, 255, 0.12)));
    }

    .rule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 0.95rem;
    }

    .services-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 12px;
      border-top: 1px dashed var(--divider-color, rgba(255, 255, 255, 0.16));
    }

    .services-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--secondary-text-color, #9ca3af);
    }

    .service-card {
      background: var(--card-background-color, rgba(15, 23, 42, 0.45));
      border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .service-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--secondary-text-color, #9ca3af);
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

    .btn-secondary {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary-color, #38bdf8);
      border: 1px solid rgba(56, 189, 248, 0.35);
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.35);
    }

    .btn-danger-sm {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      padding: 4px 10px;
    }
  `;
}
