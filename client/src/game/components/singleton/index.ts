import type {KeysInput} from './keys-input.ts';
import {keysInput} from './keys-input.ts';

export * from './keys-input.ts';

export type SingletonComponents = KeysInput;

export const singletonComponentsValues = [keysInput] as const;
