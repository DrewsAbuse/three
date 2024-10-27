import type {UIComponents} from './Components/types.ts';
import {ComputedSignal, Signal, effectsRegistrar, signalsRegistrar} from './signals.ts';

type GenerateComponentParamsGeneric<
  T extends keyof UIComponents,
  P extends UIComponents[T] = UIComponents[T],
> = P;

export const tagOptions = <T extends keyof UIComponents = never>(
  options: GenerateComponentParamsGeneric<T>
) =>
  Object.entries(options)
    .map(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        return `${key}="${value}"`;
      }

      if (value === undefined) {
        return '';
      }

      if (value instanceof Signal) {
        return `${key}="${value.id}"`;
      }

      throw new Error(`Invalid value type: ${value}`);
    })
    .join(' ');

export {Signal, signalsRegistrar, effectsRegistrar, ComputedSignal};
