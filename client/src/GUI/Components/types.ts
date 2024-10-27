import type {PlayerHUDProps, playerHudTag} from './PlayerHUD.ts';
import type {SliderProps, sliderTag} from './Slider.ts';
import type {ButtonProps, buttonTag} from './Button.ts';
import type {SpeedometerProps, speedometerTag} from './Speedometer.ts';

export type UIComponents = {
  [playerHudTag]: PlayerHUDProps;
  [sliderTag]: SliderProps;
  [buttonTag]: ButtonProps;
  [speedometerTag]: SpeedometerProps;
};

export type BooleanString = 'true' | 'false';
