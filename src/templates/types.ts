import { CSSResultGroup, TemplateResult } from 'lit';

export interface CardTemplate {
    name: string;
    defaultIcon: string;
    styles: CSSResultGroup;
    renderIcon?: (icon: string) => TemplateResult;
}
