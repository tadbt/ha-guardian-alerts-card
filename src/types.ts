import { ActionOrServiceInput } from './templates/types';

export type AlertSeverity = 'SECURE' | 'INFO' | 'WARNING' | 'CRITICAL';

export type AlertPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type StateOperator = 'equals' | 'not_equals' | 'contains';

export interface DurationConfig {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}

export interface AlertCondition {
    entity: string;
    state?: string | number | boolean | Array<string | number | boolean>;
    states?: Array<string | number | boolean>;
    operator?: StateOperator;
    for?: DurationConfig | number | string;
    duration?: DurationConfig | number | string;
}

export interface AlertRule {
    entity: string;
    state?: string | number | boolean | Array<string | number | boolean>; // Single or multiple trigger states
    states?: Array<string | number | boolean>; // Optional alias for multiple trigger states
    operator?: StateOperator; // 'equals' (default) | 'not_equals' | 'contains'
    for?: DurationConfig | number | string; // How long entity must stay in state to trigger
    duration?: DurationConfig | number | string; // Alias for `for`
    conditions?: AlertCondition[]; // Additional AND conditions that must all match
    priority?: AlertPriority; // 'P1' | 'P2' | 'P3' | 'P4' (orders active alerts)
    template?: AlertSeverity;
    severity?: AlertSeverity;
    message: string;
    icon?: string;
    icon_color?: string;
    on_active?: ActionOrServiceInput;
    tap_action?: ActionOrServiceInput;
    hold_action?: ActionOrServiceInput;
}

export interface DefaultAlertConfig {
    entity?: string;
    template?: AlertSeverity;
    message?: string;
    icon?: string;
    icon_color?: string;
    tap_action?: ActionOrServiceInput;
    hold_action?: ActionOrServiceInput;
}

export interface GuardianAlertsCardConfig {
    type: string;
    title?: string;
    show_default_alert?: boolean;
    default_alert?: DefaultAlertConfig;
    alerts: AlertRule[];
}

