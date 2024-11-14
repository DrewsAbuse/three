import type {TickParams} from '../../types';
import type {ComponentIdToData} from '../../components';
import {System} from '../base.ts';
import {componentIdsEnum} from '../../components';
import {signalsRegistrar} from '../../../GUI';

export class UIWriteSystem extends System {
  constructor() {
    super({
      requiredComponents: new Uint16Array([componentIdsEnum.uiWrite]),
    });
  }

  signalIdToLastUpdatedVersion = new Map<string, number>();

  signalIdsForUIWrite: string[] = [];

  updateTick({
    partition,
    entityLength,
    lastLiveEntityIndex,
    entityStartOffset,
    idToComponentOffset,
  }: TickParams) {
    this.signalIdsForUIWrite.length = 0;

    const uiWriteIndex = idToComponentOffset[componentIdsEnum.uiWrite];

    for (const [signalId, lastUpdatedVersion] of this.signalIdToLastUpdatedVersion) {
      const signal = signalsRegistrar.getSignalById(signalId);

      if (signal.setterVersion !== lastUpdatedVersion) {
        this.signalIdToLastUpdatedVersion.set(signalId, signal.setterVersion);

        this.signalIdsForUIWrite.push(signalId);
      }
    }

    if (this.signalIdsForUIWrite.length === 0) {
      return;
    }

    for (let index = entityStartOffset; index <= lastLiveEntityIndex; index += entityLength) {
      const uiWrite = partition[
        index + uiWriteIndex
      ] as ComponentIdToData[componentIdsEnum.uiWrite];

      for (let i = 0; i < this.signalIdsForUIWrite.length; i++) {
        const signalId = this.signalIdsForUIWrite[i];
        const signal = signalsRegistrar.getSignalById(signalId);

        uiWrite.signalIdToSetter[signalId].setter({
          value: signal.value,
          partition,
          idToComponentOffset,
          index,
        });
      }
    }
  }
}
