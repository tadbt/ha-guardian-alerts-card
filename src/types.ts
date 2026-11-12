export type AlertSeverity = 'SECURE' | 'INFO' | 'WARNING' | 'CRITICAL';

export type AlertPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type StateOperator = 'equals' | 'not_equals' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte';

export type ChimeType = 'none' | 'soft_chime' | 'double_beep' | 'urgent_alarm';

export interface DurationConfig {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}

export interface AlertRule {
    entity?: string; // Single entity (supported for backwards compatibility)
    entities?: string[]; // Multiple entities to monitor (triggers for each matching entity)
    state?: string | number | boolean | Array<string | number | boolean>; // Single or multiple trigger states
    states?: Array<string | number | boolean>; // Optional alias for multiple trigger states
    operator?: StateOperator; // 'equals' (default) | 'not_equals' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte'
    for?: DurationConfig | number | string; // How long entity must stay in state to trigger
    duration?: DurationConfig | number | string; // Alias for `for`
    priority?: AlertPriority; // 'P1' | 'P2' | 'P3' | 'P4' (orders active alerts)
    template?: AlertSeverity;
    severity?: AlertSeverity;
    chime?: ChimeType | boolean; // Optional chime sound when alert activates
    message?: string; // Optional; defaults to "<entity name> is <state>" when empty
    icon?: string;
    icon_color?: string;
}

export interface KeypadConfig {
    enabled?: boolean; // Defaults to true on the secure card
    entity?: string; // Target entity to update on Arm/Away/Disarm
    arm_delay?: number; // Seconds delay before arming (default: 0)
    chime?: ChimeType; // Optional chime played on Arm / Away / Disarm
    passcodes?: string[]; // One or more valid passcodes (required for Disarm)
}

export interface DefaultAlertConfig {
    entity?: string;
    template?: AlertSeverity;
    message?: string;
    icon?: string;
    icon_color?: string;
    keypad?: KeypadConfig;
}

export interface GuardianAlertsCardConfig {
    type: string;
    title?: string;
    show_default_alert?: boolean;
    default_alert?: DefaultAlertConfig;
    alerts: AlertRule[];
}
