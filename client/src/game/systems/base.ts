import type {RequiredComponents} from './index.ts';

export abstract class System {
  requiredComponents: RequiredComponents;

  constructor({requiredComponents}: {requiredComponents: RequiredComponents}) {
    this.requiredComponents = requiredComponents;
  }

  update({timeElapsedS}: {timeElapsedS: number; props: Record<string, unknown>}) {
    console.log(timeElapsedS);
    throw new Error('update not implemented');
  }
}
