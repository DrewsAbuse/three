import type {ClientWorld} from '../world/client.ts';
import type {BitMaskToTypes, BitMasks} from '../entities/components/component.ts';
import {bitMasks} from '../entities/components/component.ts';
import {partitionConstants} from '../world';
import {System} from './index.ts';

export class CameraSystem extends System {
  world: ClientWorld;

  constructor(world: ClientWorld) {
    super({
      requiredComponents: [bitMasks.keysInput, bitMasks.camera],
    });
    this.world = world;
  }

  update({timeElapsedS}: {timeElapsedS: number}) {
    const archetypePartition = this.world.getArchetypePartitionByComponentsMasks(
      this.requiredComponents
    );

    if (archetypePartition === undefined) {
      return;
    }

    const lastEntityIndex = archetypePartition[partitionConstants.lastInsertedIndex];
    const componentsIndexes = archetypePartition[partitionConstants.componentsIndexesOffset];
    const entityLength = archetypePartition[partitionConstants.entityLengthOffset];

    const cameraIndex = componentsIndexes[bitMasks.camera];
    const meshIndex = componentsIndexes[bitMasks.mesh];

    for (let i = partitionConstants.entityLengthOffset; i < lastEntityIndex; i += entityLength) {
      const mesh = archetypePartition[i + meshIndex] as BitMaskToTypes[BitMasks['mesh']];
      const cameraSettings = archetypePartition[
        i + cameraIndex
      ] as BitMaskToTypes[BitMasks['camera']];

      //console.log('cameraSettings', cameraSettings.lookAt);

      //Smoothing rate dictates the proportion of source remaining after one second Math.pow(X, timeElapsedS)
      const t1 = 1.0 - Math.pow(0.5, timeElapsedS * cameraSettings.lerpCoefficient);
      this.world.camera.position.lerp(
        cameraSettings.idealOffset.applyQuaternion(mesh.quaternion).add(mesh.position),
        t1
      );

      const t2 = 1.0 - Math.pow(0.5, timeElapsedS * cameraSettings.slerpCoefficient);
      this.world.camera.quaternion.slerp(mesh.quaternion, t2);

      cameraSettings.idealOffset.set(
        cameraSettings.position.x,
        cameraSettings.position.y,
        cameraSettings.position.z
      );
    }
  }
}
