import { CardTemplate } from './types';
import { SecureTemplate } from './secure';
import { InfoTemplate } from './info';
import { WarningTemplate } from './warning';
import { CriticalTemplate } from './critical';

export * from './types';
export * from './base';

export const AlertTemplates: Record<string, CardTemplate> = {
    SECURE: SecureTemplate,
    INFO: InfoTemplate,
    WARNING: WarningTemplate,
    CRITICAL: CriticalTemplate,
};

export function getTemplate(templateName?: string): CardTemplate {
    const key = (templateName || 'INFO').toUpperCase();
    return AlertTemplates[key] || AlertTemplates.INFO;
}
