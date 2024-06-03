import type {Camera} from 'three';
import type {BitMaskToTypes, BitMasks} from '../components';
import {bitMasks} from '../components';
import {System} from './base.ts';

export class CameraSystem extends System {
  private camera: Camera;

  constructor(cameraInstance: Camera) {
    super({
      requiredComponents: [bitMasks.keysInput, bitMasks.camera],
    });
    this.camera = cameraInstance;
  }

  update({timeElapsedS}: {timeElapsedS: number}) {
    const archetypePartitions = this.storage.getArchetypePartitionByComponentsMasks(
      this.requiredComponents
    );

    if (archetypePartitions === undefined) {
      return;
    }

    for (const archetypePartition of archetypePartitions) {
      const lastEntityIndex =
        archetypePartition[this.storage.partitionConstants.lastNotDeletedEntityIndex];
      const componentsIndexes =
        archetypePartition[this.storage.partitionConstants.componentsIndexesOffset];
      const entityLength = archetypePartition[this.storage.partitionConstants.entityLengthOffset];

      const cameraIndex = componentsIndexes[bitMasks.camera];
      const meshIndex = componentsIndexes[bitMasks.mesh];

      for (
        let i = this.storage.partitionConstants.entityLengthOffset;
        i < lastEntityIndex;
        i += entityLength
      ) {
        const mesh = archetypePartition[i + meshIndex] as BitMaskToTypes[BitMasks['mesh']];
        const cameraSettings = archetypePartition[
          i + cameraIndex
        ] as BitMaskToTypes[BitMasks['camera']];

        this.camera.position.lerp(
          cameraSettings.idealOffset.applyQuaternion(mesh.quaternion).add(mesh.position),
          1.0 - Math.pow(0.5, timeElapsedS * cameraSettings.lerpCoefficient)
        );

        this.camera.quaternion.slerp(
          mesh.quaternion,
          1.0 - Math.pow(0.5, timeElapsedS * cameraSettings.slerpCoefficient)
        );

        cameraSettings.idealOffset.set(
          cameraSettings.position.x,
          cameraSettings.position.y,
          cameraSettings.position.z
        );
      }
    }
  }
}
