import type {RequiredComponents} from './index.ts';
import type {TickParams} from '../types';

export abstract class System {
  requiredComponents: RequiredComponents;

  protected constructor({requiredComponents}: {requiredComponents: RequiredComponents}) {
    this.requiredComponents = requiredComponents;
  }

  abstract updateTick({systemStep}: TickParams): void;
}

export abstract class SubSystem {
  update({timeElapsedS}: {timeElapsedS: number; props: Record<string, unknown>}) {
    console.log(timeElapsedS);
    throw new Error('update not implemented');
  }
}
