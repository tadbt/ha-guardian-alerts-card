import { CSSResultGroup, TemplateResult } from 'lit';

export interface ActionConfig {
    action?: 'dismiss' | 'snooze' | 'snooze_30m' | 'delay_30m' | 'more-info' | 'none' | string;
    snooze_minutes?: number;
}

export interface CardTemplate {
    name: string;
    defaultIcon: string;
    styles: CSSResultGroup;
    renderIcon?: (icon: string) => TemplateResult;
}
