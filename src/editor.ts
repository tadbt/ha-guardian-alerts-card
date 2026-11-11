import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { AlertRule, AlertSeverity, GuardianAlertsCardConfig } from './types';
import { getTemplate, ServiceCallConfig } from './templates';

@customElement('guardian-alerts-card-editor')
export class GuardianAlertsCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private config?: GuardianAlertsCardConfig;

  public setConfig(config: GuardianAlertsCardConfig): void {
    this.config = {
      ...config,
      alerts: Array.isArray(config?.alerts) ? config.alerts.map((r) => ({ ...r })) : [],
    };
  }

  private emitConfigChanged(nextAlerts: AlertRule[]): void {
    if (!this.config) return;
    const nextConfig: GuardianAlertsCardConfig = {
      ...this.config,
      type: this.config.type || 'custom:guardian-alerts-card',
      alerts: nextAlerts,
    };
    this.config = nextConfig;
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: nextConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  private updateRule(index: number, patch: Partial<AlertRule>): void {
    if (!this.config) return;
    const next = this.config.alerts.map((rule, i) => {
      if (i !== index) return rule;
      const updated: AlertRule = { ...rule, ...patch };
      if (!updated.icon || updated.icon.trim() === '') {
        delete updated.icon;
      }
      return updated;
    });
    this.emitConfigChanged(next);
  }

  private addRule(): void {
    const existing = this.config?.alerts || [];
    const firstEntity = Object.keys(this.hass?.states || {})[0] || 'binary_sensor.example';
    this.emitConfigChanged([
      ...existing,
      {
        entity: firstEntity,
        state: 'on',
        template: 'WARNING',
        message: 'New Guardian Alert',
      },
    ]);
  }

  private removeRule(index: number): void {
    if (!this.config) return;
    const next = this.config.alerts.filter((_, i) => i !== index);
    this.emitConfigChanged(next);
  }

  private normalizeOnActiveList(rule: AlertRule): ServiceCallConfig[] {
    if (!rule.on_active) return [];
    if (Array.isArray(rule.on_active)) {
      return rule.on_active.map((item) => ({
        service: item.service || '',
        target: item.target,
        service_data: item.service_data ?? item.data,
      }));
    }
    if (rule.on_active.service) {
      return [
        {
          service: rule.on_active.service,
          target: rule.on_active.target,
          service_data: rule.on_active.service_data ?? rule.on_active.data,
        },
      ];
    }
    return [];
  }

  private addOnActiveService(ruleIndex: number): void {
    if (!this.config) return;
    const rule = this.config.alerts[ruleIndex];
    const current = this.normalizeOnActiveList(rule);
    this.updateRule(ruleIndex, {
      on_active: [
        ...current,
        {
          service: 'scene.turn_on',
          target: { entity_id: '' },
        },
      ],
    });
  }

  private updateOnActiveService(
    ruleIndex: number,
    serviceIndex: number,
    field: 'service' | 'entity_id' | 'message',
    value: string
  ): void {
    if (!this.config) return;
    const rule = this.config.alerts[ruleIndex];
    const list = this.normalizeOnActiveList(rule).map((svc, idx) => {
      if (idx !== serviceIndex) return svc;
      const next: ServiceCallConfig = { ...svc };
      if (field === 'service') {
        next.service = value;
      } else if (field === 'entity_id') {
        if (value.trim()) {
          next.target = { ...(next.target || {}), entity_id: value.trim() };
        } else {
          delete next.target;
        }
      } else if (field === 'message') {
        const currentData = { ...(next.service_data || {}) };
        if (value.trim()) {
          currentData.message = value;
          next.service_data = currentData;
        } else {
          delete currentData.message;
          next.service_data = Object.keys(currentData).length > 0 ? currentData : undefined;
        }
      }
      return next;
    });
    this.updateRule(ruleIndex, { on_active: list.length > 0 ? list : undefined });
  }

  private removeOnActiveService(ruleIndex: number, serviceIndex: number): void {
    if (!this.config) return;
    const rule = this.config.alerts[ruleIndex];
    const list = this.normalizeOnActiveList(rule).filter((_, idx) => idx !== serviceIndex);
    this.updateRule(ruleIndex, { on_active: list.length > 0 ? list : undefined });
  }

  protected render() {
    if (!this.config) return nothing;
    const entityIds = Object.keys(this.hass?.states || {}).sort();

    return html`
      <div class="editor-container">
        <datalist id="ha-entities-list">
          ${entityIds.map((id) => html`<option value="${id}"></option>`)}
        </datalist>

        ${this.config.alerts.map((rule, index) => {
          const tpl = getTemplate(rule.template || rule.severity);
          const services = this.normalizeOnActiveList(rule);

          return html`
            <div class="rule-card">
              <div class="rule-header">
                <span class="rule-title">Alert #${index + 1} (${tpl.name})</span>
                <button
                  type="button"
                  class="btn-danger"
                  @click=${() => this.removeRule(index)}
                >
                  Remove
                </button>
              </div>

              <div class="grid">
                <label class="field">
                  <span>Entity</span>
                  <input
                    type="text"
                    list="ha-entities-list"
                    .value=${rule.entity || ''}
                    placeholder="binary_sensor.garage_door"
                    @input=${(e: Event) =>
                      this.updateRule(index, { entity: (e.target as HTMLInputElement).value })}
                  />
                </label>

                <label class="field">
                  <span>Trigger State</span>
                  <input
                    type="text"
                    .value=${rule.state || ''}
                    placeholder="on / triggered"
                    @input=${(e: Event) =>
                      this.updateRule(index, { state: (e.target as HTMLInputElement).value })}
                  />
                </label>

                <label class="field">
                  <span>Template</span>
                  <select
                    .value=${(rule.template || rule.severity || 'INFO').toUpperCase()}
                    @change=${(e: Event) =>
                      this.updateRule(index, {
                        template: (e.target as HTMLSelectElement).value as AlertSeverity,
                      })}
                  >
                    <option value="INFO">INFO (Static)</option>
                    <option value="WARNING">WARNING (Slow Flash)</option>
                    <option value="CRITICAL">CRITICAL (Slow Flash)</option>
                  </select>
                </label>

                <label class="field">
                  <span>Icon (blank = default ${tpl.defaultIcon})</span>
                  <input
                    type="text"
                    .value=${rule.icon || ''}
                    placeholder="Default: ${tpl.defaultIcon}"
                    @input=${(e: Event) =>
                      this.updateRule(index, { icon: (e.target as HTMLInputElement).value })}
                  />
                </label>
              </div>

              <label class="field full">
                <span>Alert Message</span>
                <input
                  type="text"
                  .value=${rule.message || ''}
                  placeholder="Garage door opened"
                  @input=${(e: Event) =>
                    this.updateRule(index, { message: (e.target as HTMLInputElement).value })}
                />
              </label>

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
                  const targetEntity =
                    typeof svc.target?.entity_id === 'string'
                      ? svc.target.entity_id
                      : Array.isArray(svc.target?.entity_id)
                        ? svc.target?.entity_id.join(', ')
                        : '';
                  const msgParam = svc.service_data?.message ?? '';

                  return html`
                    <div class="service-row">
                      <input
                        type="text"
                        .value=${svc.service || ''}
                        placeholder="Service (e.g. scene.turn_on or script.tts_announce)"
                        @input=${(e: Event) =>
                          this.updateOnActiveService(
                            index,
                            sIdx,
                            'service',
                            (e.target as HTMLInputElement).value
                          )}
                      />
                      <input
                        type="text"
                        list="ha-entities-list"
                        .value=${targetEntity}
                        placeholder="Target entity_id (optional, e.g. scene.alert)"
                        @input=${(e: Event) =>
                          this.updateOnActiveService(
                            index,
                            sIdx,
                            'entity_id',
                            (e.target as HTMLInputElement).value
                          )}
                      />
                      <input
                        type="text"
                        .value=${msgParam}
                        placeholder="Message param (optional, e.g. {{ message }})"
                        @input=${(e: Event) =>
                          this.updateOnActiveService(
                            index,
                            sIdx,
                            'message',
                            (e.target as HTMLInputElement).value
                          )}
                      />
                      <button
                        type="button"
                        class="btn-danger-sm"
                        title="Remove Service"
                        @click=${() => this.removeOnActiveService(index, sIdx)}
                      >
                        ✕
                      </button>
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
      gap: 14px;
      padding: 8px 0;
      color: var(--primary-text-color, #f3f4f6);
    }

    .rule-card {
      background: var(--secondary-background-color, rgba(255, 255, 255, 0.04));
      border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .rule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.78rem;
      color: var(--secondary-text-color, #9ca3af);
    }

    .field.full {
      width: 100%;
    }

    input,
    select {
      background: var(--card-background-color, #1e293b);
      color: var(--primary-text-color, #f3f4f6);
      border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.18));
      border-radius: 6px;
      padding: 7px 10px;
      font-size: 0.85rem;
      outline: none;
    }

    input:focus,
    select:focus {
      border-color: var(--primary-color, #38bdf8);
    }

    .services-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 6px;
      border-top: 1px dashed var(--divider-color, rgba(255, 255, 255, 0.12));
    }

    .services-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--secondary-text-color, #9ca3af);
    }

    .service-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 6px;
      align-items: center;
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
      padding: 10px 14px;
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
      padding: 6px 9px;
    }
  `;
}

