import type {RequiredComponents} from './index.ts';
import type {ArchetypePartition} from '../world/storage.ts';
import {WorldStorage} from '../world/storage.ts';

export abstract class System {
  requiredComponents: RequiredComponents;
  storage = WorldStorage;

  protected constructor({requiredComponents}: {requiredComponents: RequiredComponents}) {
    this.requiredComponents = requiredComponents;
  }

  update({timeElapsedS}: {timeElapsedS: number; archetypePartitions: ArchetypePartition[]}) {
    console.log(timeElapsedS);
    throw new Error('update not implemented');
  }
}

export abstract class SubSystem {
  storage = WorldStorage;
  update({timeElapsedS}: {timeElapsedS: number; props: Record<string, unknown>}) {
    console.log(timeElapsedS);
    throw new Error('update not implemented');
  }
}
