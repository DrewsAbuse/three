import {PlayerHUDCustomElement, playerHudTag} from './PlayerHUD.ts';
import {SliderCustomElement, sliderTag} from './Slider.ts';
import {ButtonCustomElement, buttonTag} from './Button.ts';
import {SpeedometerCustomElement, speedometerTag} from './Speedometer.ts';

export * from './Slider.ts';
export * from './PlayerHUD.ts';
export * from './Button.ts';

export const initGUI = () => {
  customElements.define(playerHudTag, PlayerHUDCustomElement);
  customElements.define(sliderTag, SliderCustomElement);
  customElements.define(buttonTag, ButtonCustomElement);
  customElements.define(speedometerTag, SpeedometerCustomElement);
};

export const objectEntries = <T extends object>(obj: T) =>
  Object.entries(obj) as [keyof T, T[keyof T]][];
