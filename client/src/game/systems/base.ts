import type {RequiredComponents} from './index.ts';
import type {TickParams} from '../types.ts';

export abstract class System {
  requiredComponents: RequiredComponents;

  protected constructor({requiredComponents}: {requiredComponents: RequiredComponents}) {
    this.requiredComponents = requiredComponents;
  }

  updateTick({timeElapsed}: TickParams) {
    console.log(timeElapsed);
    throw new Error('update not implemented');
  }
}

export abstract class SubSystem {
  update({timeElapsedS}: {timeElapsedS: number; props: Record<string, unknown>}) {
    console.log(timeElapsedS);
    throw new Error('update not implemented');
  }
}
