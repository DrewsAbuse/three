import type {Signal} from '../signals.ts';
import {effectsRegistrar} from '../signals.ts';
import {tagOptions} from '../index.ts';
import {ExtendedHTMLElement} from './base.ts';

export type SpeedometerProps = {
  speedSignal: Signal<number>;
  maxSpeed: number;
};

export type SpeedometerTag = typeof speedometerTag;

export const speedometerTag = 'custom-speedometer';

export class SpeedometerCustomElement extends ExtendedHTMLElement<SpeedometerProps> {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  getAttributes() {
    return {
      maxSpeed: parseInt(this.getAttribute('maxSpeed') || '100', 10),
      speedSignal: this.getSignal<number>('speedSignal'),
    };
  }

  connectedCallback() {
    const {speedSignal, maxSpeed} = this.getAttributes();
    const speedometerId = `speedometer-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 5)}`;

    this.setTemplate(/* HTML */ `
      <link rel="stylesheet" href="style.css" />
      <div id="${speedometerId}" class="speedometer-container">
        <div class="speedometer">
          <div class="speedometer-needle"></div>
          <div class="speedometer-center"></div>
        </div>
        <div class="speed-value" id="speedValue">${speedSignal.value} km/h</div>
      </div>
    `);

    const speedValueElement = this.getElementById<HTMLDivElement>('speedValue');
    const needleElement = this.shadowRoot!.querySelector('.speedometer-needle') as HTMLDivElement;

    effectsRegistrar.subscribeEffectToSignals(() => {
      //Use static 000 km/h
      const speed = speedSignal.value;

      const stringValue = Math.floor(speed).toString().padStart(3, '0');
      speedValueElement!.textContent = `${stringValue}`;

      // Update the rotation of the needle based on the speed and maxSpeed
      const rotation = (speed / maxSpeed) * 180; // Assuming 180° is the full range
      needleElement!.style.transform = `rotate(${rotation}deg)`;
    });
  }
}

export const createSpeedometer = (params: SpeedometerProps) => /* HTML */ `<${speedometerTag}
    ${tagOptions<SpeedometerTag>(params)}
  ></${speedometerTag}>`;
