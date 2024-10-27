import type {Signal} from '../signals.ts';
import {tagOptions} from '../index.ts';
import {ExtendedHTMLElement} from './base.ts';

export type ButtonProps = {
  label: string | Signal<string>;
};
export type ButtonTag = typeof buttonTag;

export const buttonTag = 'custom-button';

export class ButtonCustomElement extends ExtendedHTMLElement<ButtonProps> {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  getAttributes() {
    return {
      label: this.getAttribute('label') ?? this.getSignal<string>('label'),
    };
  }

  connectedCallback() {
    const {label} = this.getAttributes();

    this.setTemplate(/* HTML */ `
      <link rel="stylesheet" href="style.css" />
      <button class="nes-btn is-primary" id="${buttonTag}">
        ${typeof label === 'string' ? label : label.value}
      </button>
    `);
  }
}

export const createButton = (params: ButtonProps) => /* HTML */ `<${buttonTag}
    ${tagOptions<ButtonTag>(params)}
  ></${buttonTag}> `;
