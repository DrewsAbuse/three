import type {Signal} from '../signals.ts';
import type {BooleanString} from './types.ts';
import {tagOptions} from '../index.ts';
import {effectsRegistrar} from '../signals.ts';
import {ExtendedHTMLElement} from './base.ts';

export type SliderTag = typeof sliderTag;

export const sliderTag = 'nes-slider';
export const sliderCSSClass = 'slider-container';

export type SliderProps = {
  valueSignal: Signal<number>;
  min: string;
  max: string;
  step: string;
  isNegative?: BooleanString;
};

export class SliderCustomElement extends ExtendedHTMLElement<SliderProps> {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  getAttributes() {
    return {
      min: this.getAttribute('min') || '0',
      max: this.getAttribute('max') || '100',
      step: this.getAttribute('step') || '1',
      valueSignal: this.getSignal<number>('valueSignal'),
      isNegative: (this.getAttribute('isNegative') ?? 'false') as BooleanString,
    };
  }

  connectedCallback() {
    const {valueSignal, min, max, step, isNegative} = this.getAttributes();

    const inputId = `slider-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .substring(2, 5)}`;

    // Use innerHTML for the entire structure and styles
    this.setTemplate(/* HTML */ `
      <link rel="stylesheet" href="style.css" />
      <div class="${sliderCSSClass}">
        <input id=${inputId} class="slider" type="range" min="${min}" max="${max}" step="${step}" />
      </div>
    `);

    // Reference the input element by ID
    const inputElement = this.getElementById<HTMLInputElement>(inputId);

    effectsRegistrar.subscribeEffectToSignals(() => {
      inputElement.value = Math.abs(valueSignal.value).toString();
    });

    // Update signal on input change
    inputElement.addEventListener('input', () => {
      valueSignal!.value =
        isNegative === 'true' ? -parseFloat(inputElement!.value) : parseFloat(inputElement!.value);
    });
  }
}

export const createSlider = (params: SliderProps) => /* HTML */ `<${sliderTag}
    ${tagOptions<SliderTag>(params)}
  ></${sliderTag}> `;
