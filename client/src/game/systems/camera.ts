import * as THREE from 'three';
import type {ControlsValue} from '../keys-input.ts';
import type {ClientWorld} from '../ecs.ts';
import {componentTypeToBitMask} from '../component.ts';

export const cameraSystem = function (this: ClientWorld, timeElapsedS: number) {
  const archetypePartition = this.getArchetypePartitionByComponentsMasks([
    componentTypeToBitMask.keys,
    componentTypeToBitMask.mesh,
  ]);
  const componentsIndexes = archetypePartition[0];

  for (let i = this.archetypePartitionStartIndex; i < archetypePartition.length; i++) {
    const idealOffset = new THREE.Vector3(0, 3, 10);
    const input = archetypePartition[i][
      componentsIndexes[componentTypeToBitMask.keys]
    ] as ControlsValue;

    const mesh = archetypePartition[i][
      componentsIndexes[componentTypeToBitMask.mesh]
    ] as THREE.Mesh;

    if (input.axis1Side) {
      idealOffset.lerp(new THREE.Vector3(2 * input.axis1Side, 4, 10), Math.abs(input.axis1Side));
    }

    if (input.axis1Forward < 0) {
      idealOffset.lerp(
        new THREE.Vector3(0, 4, 12 * -input.axis1Forward),
        Math.abs(input.axis1Forward)
      );
    }

    if (input.axis1Forward > 0) {
      idealOffset.lerp(
        new THREE.Vector3(0, 4, 15 * input.axis1Forward),
        Math.abs(input.axis1Forward)
      );
    }

    idealOffset.applyQuaternion(mesh.quaternion);
    idealOffset.add(mesh.position);

    const t1 = 1.0 - Math.pow(0.05, timeElapsedS);
    const t2 = 1.0 - Math.pow(0.01, timeElapsedS);

    this.camera.position.lerp(idealOffset, t1);
    this.camera.quaternion.slerp(mesh.quaternion, t2);
  }
};
