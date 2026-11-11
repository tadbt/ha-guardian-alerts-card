import { ActionConfig, ActionOrServiceInput, ServiceCallConfig, TargetConfig } from '../templates/types';
import { HomeAssistant } from 'custom-card-helpers';

export interface ActionPayload {
    hass: HomeAssistant;
    config?: ActionOrServiceInput;
    defaultEntity?: string;
    defaultMessage?: string;
}

function interpolateData(
    raw: Record<string, any> | undefined,
    context: { entity?: string; message?: string }
): Record<string, any> | undefined {
    if (!raw) return undefined;
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (typeof value === 'string') {
            result[key] = value
                .replace(/\{\{\s*message\s*\}\}/g, context.message ?? '')
                .replace(/\{\{\s*entity\s*\}\}/g, context.entity ?? '');
        } else {
            result[key] = value;
        }
    }
    return result;
}

function invokeService(
    hass: HomeAssistant,
    call: ServiceCallConfig,
    context: { entity?: string; message?: string }
): void {
    const rawService =
        call.service ||
        call.perform_action ||
        (call.action && call.action.includes('.') ? call.action : undefined);
    if (!rawService) return;
    const [domain, service] = rawService.split('.');
    if (!domain || !service) return;
    const payload = interpolateData(call.service_data ?? call.data, context);
    hass.callService(domain, service, payload, call.target);
}

function executeSingleAction(
    hass: HomeAssistant,
    item: ActionConfig | ServiceCallConfig,
    context: { entity?: string; message?: string }
): void {
    const actionConfig = item as ActionConfig;

    // If services array is provided, run all of them
    if (Array.isArray(actionConfig.services) && actionConfig.services.length > 0) {
        for (const svc of actionConfig.services) {
            invokeService(hass, svc, context);
        }
        if (!actionConfig.service && !actionConfig.perform_action) return;
    }

    // Default to 'call-service' when a `service` or `perform_action` key is present without an explicit `action`
    const hasService = Boolean(
        actionConfig.service ||
            actionConfig.perform_action ||
            (actionConfig.action && actionConfig.action.includes('.'))
    );
    const actionType =
        actionConfig.action && !actionConfig.action.includes('.')
            ? actionConfig.action
            : hasService
              ? 'call-service'
              : 'none';
    if (actionType === 'none') return;

    switch (actionType) {
        case 'more-info': {
            const entityId = (actionConfig.target as TargetConfig | undefined)?.entity_id || context.entity;
            if (!entityId) return;
            const event = new CustomEvent('hass-more-info', {
                bubbles: true,
                composed: true,
                detail: { entityId: Array.isArray(entityId) ? entityId[0] : entityId },
            });
            window.dispatchEvent(event);
            break;
        }

        case 'toggle': {
            const entityId = (actionConfig.target as TargetConfig | undefined)?.entity_id || context.entity;
            if (!entityId) return;
            hass.callService('homeassistant', 'toggle', undefined, { entity_id: entityId });
            break;
        }

        case 'navigate': {
            if (!actionConfig.navigation_path) return;
            window.history.pushState(null, '', actionConfig.navigation_path);
            const event = new CustomEvent('location-changed', {
                bubbles: true,
                composed: true,
            });
            window.dispatchEvent(event);
            break;
        }

        case 'url': {
            if (actionConfig.url_path) window.open(actionConfig.url_path);
            break;
        }

        case 'perform-action':
        case 'call-service': {
            invokeService(hass, actionConfig as ServiceCallConfig, context);
            break;
        }
    }
}

export function executeAction({ hass, config, defaultEntity, defaultMessage }: ActionPayload): void {
    if (!hass || !config) return;
    const context = { entity: defaultEntity, message: defaultMessage };

    if (Array.isArray(config)) {
        for (const item of config) {
            if (item) executeSingleAction(hass, item, context);
        }
    } else {
        executeSingleAction(hass, config, context);
    }
}
