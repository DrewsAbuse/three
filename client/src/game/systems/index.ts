import type {ExtractRecordValue, bitMasks} from '../components/component.ts';

export type RequiredComponents = readonly ExtractRecordValue<typeof bitMasks>[];

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
