import {MeshBasicMaterial} from 'three';
import type {ComponentIdToData} from '../components';
import type {TickParams} from '../types';
import type {GridOBBInHouse} from '../helpers/grid.ts';
import {componentIdsEnum} from '../components';
import {System} from './base.ts';

export class CollisionSystem extends System {
  grid: GridOBBInHouse;
  constructor(grid: GridOBBInHouse) {
    super({
      requiredComponents: new Uint16Array([componentIdsEnum.mesh]),
    });
    this.grid = grid;
  }

  updateTick(tickParams: TickParams) {
    const {partition, entityLength, lastLiveEntityIndex, entityStartOffset, idToComponentOffset} =
      tickParams;

    for (let index = entityStartOffset; index <= lastLiveEntityIndex; index += entityLength) {
      const entityIndex = partition[index] as number;
      const mesh = partition[
        index + idToComponentOffset[componentIdsEnum.mesh]
      ] as ComponentIdToData[componentIdsEnum.mesh];

      // Check collision

      const near = this.grid.checkCollisions(entityIndex);

      if (near[0] === 0) {
        if (entityIndex === 999) {
          // @ts-expect-error - mesh material is not null
          mesh.material!.color.set(0x00ff00);
        }

        return;
      }

      if (entityIndex === 999) {
        if (mesh.material instanceof MeshBasicMaterial) {
          mesh.material.color.set(0xff0000);
        }
      }
    }
  }
}
