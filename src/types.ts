import { ActionOrServiceInput } from './templates/types';

export type AlertSeverity = 'SECURE' | 'INFO' | 'WARNING' | 'CRITICAL';

export interface AlertRule {
    entity: string;
    state: string | number | boolean; // Any entity state or sensor value (e.g. "on", "home", 75, "> 80", "< 20")
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

