import { ActionOrServiceInput } from './templates/types';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AlertRule {
    entity: string;
    state: string; // e.g. "on", "triggered", "open"
    template?: AlertSeverity;
    severity?: AlertSeverity;
    message: string;
    icon?: string;
    icon_color?: string;
    on_active?: ActionOrServiceInput;
    tap_action?: ActionOrServiceInput;
    hold_action?: ActionOrServiceInput;
}

export interface GuardianAlertsCardConfig {
    type: string;
    title?: string;
    alerts: AlertRule[];
}
