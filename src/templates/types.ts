import { CSSResultGroup, TemplateResult } from 'lit';

export interface TargetConfig {
    entity_id?: string | string[];
    device_id?: string | string[];
    area_id?: string | string[];
}

export interface ServiceCallConfig {
    service: string;
    service_data?: Record<string, any>;
    data?: Record<string, any>;
    target?: TargetConfig;
}

export interface ActionConfig {
    action?: 'more-info' | 'navigate' | 'url' | 'call-service' | 'none';
    navigation_path?: string;
    url_path?: string;
    service?: string;
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
