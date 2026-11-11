import { CSSResultGroup, TemplateResult } from 'lit';

export interface TargetConfig {
    entity_id?: string | string[];
    device_id?: string | string[];
    area_id?: string | string[];
}

export interface ServiceCallConfig {
    service?: string;
    perform_action?: string;
    action?: string;
    service_data?: Record<string, any>;
    data?: Record<string, any>;
    target?: TargetConfig;
}

export interface ActionConfig {
    action?: 'more-info' | 'toggle' | 'navigate' | 'url' | 'call-service' | 'perform-action' | 'none' | string;
    navigation_path?: string;
    url_path?: string;
    service?: string;
    perform_action?: string;
    service_data?: Record<string, any>;
    data?: Record<string, any>;
    target?: TargetConfig;
    services?: ServiceCallConfig[];
}

export type ActionOrServiceInput =
    | ActionConfig
    | ServiceCallConfig
    | Array<ActionConfig | ServiceCallConfig>;

export interface CardTemplate {
    name: string;
    defaultIcon: string;
    styles: CSSResultGroup;
    renderIcon?: (icon: string) => TemplateResult;
}
