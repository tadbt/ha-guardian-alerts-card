import { ActionOrServiceInput } from './templates/types';

export type AlertSeverity = 'SECURE' | 'INFO' | 'WARNING' | 'CRITICAL';

export type AlertPriority = 'P1' | 'P2' | 'P3' | 'P4';

export interface ScriptDecisionResponse {
    active?: boolean;
    message?: string;
    template?: AlertSeverity;
    severity?: AlertSeverity;
    priority?: AlertPriority;
    icon?: string;
    icon_color?: string;
}

export interface AlertRule {
    entity?: string; // Primary watched entity
    entities?: string[]; // Additional watched entities (triggers script re-evaluation on change)
    state?: string | number | boolean | Array<string | number | boolean>; // Optional trigger state(s)
    states?: Array<string | number | boolean>; // Optional alias for multiple trigger states
    script?: string; // HA script (e.g. 'script.check_garage') that returns { message, template?, priority?, icon? }
    script_data?: Record<string, any>; // Optional extra variables passed to the decision script
    priority?: AlertPriority; // 'P1' | 'P2' | 'P3' | 'P4' (orders active alerts)
    template?: AlertSeverity;
    severity?: AlertSeverity;
    message?: string; // Static message (or fallback if script omits message)
    icon?: string;
    icon_color?: string;
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
