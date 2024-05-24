import type {RequiredComponents} from './index.ts';
import type {ArchetypePartition} from '../world';

export abstract class System {
  requiredComponents: RequiredComponents;

  protected constructor({requiredComponents}: {requiredComponents: RequiredComponents}) {
    this.requiredComponents = requiredComponents;
  }

  update({timeElapsedS}: {timeElapsedS: number; archetypePartitions: ArchetypePartition[]}) {
    console.log(timeElapsedS);
    throw new Error('update not implemented');
  }
}

export abstract class SubSystem {
  update({timeElapsedS}: {timeElapsedS: number; props: Record<string, unknown>}) {
    console.log(timeElapsedS);
    throw new Error('update not implemented');
  }
}
