import * as THREE from 'three';
import type {ControlsValue} from '../keys-input.ts';
import type {Vector3} from 'three';
import type {EntityArray, World} from '../ecs.ts';
import {componentTypeToBitMask} from '../component.ts';
import {negativeClamp} from '../helpers';

export const movementSystem = function (this: World, timeElapsedS: number) {
  let maskForFind = 0;

  maskForFind |= componentTypeToBitMask.keys;
  maskForFind |= componentTypeToBitMask.mesh;
  maskForFind |= componentTypeToBitMask.velocity;
  maskForFind |= componentTypeToBitMask.acceleration;
  maskForFind |= componentTypeToBitMask.decceleration;

  const archetypePartition = this.getArchetypePartitionByComponentsMask(maskForFind);
  const componentsIndexes = archetypePartition[0];

  const vector3Tmp = new THREE.Vector3(0, 0, 0);
  vector3Tmp.multiplyScalar(timeElapsedS);

  for (let i = 1; i < archetypePartition.length; i++) {
    const entityArray = archetypePartition[i] as EntityArray;

    const input = entityArray[componentsIndexes[componentTypeToBitMask.keys]] as ControlsValue;
    const mesh = entityArray[componentsIndexes[componentTypeToBitMask.mesh]] as THREE.Mesh;
    const velocity = entityArray[componentsIndexes[componentTypeToBitMask.velocity]] as Vector3;
    const deacceleration = entityArray[
      componentsIndexes[componentTypeToBitMask.decceleration]
    ] as Vector3;
    const acceleration = entityArray[
      componentsIndexes[componentTypeToBitMask.acceleration]
    ] as Vector3;

    const frameDeacceleration = new THREE.Vector3(
      velocity.x * deacceleration.x,
      velocity.y * deacceleration.y,
      velocity.z * deacceleration.z
    );
    frameDeacceleration.multiplyScalar(timeElapsedS);
    velocity.add(frameDeacceleration);
    velocity.z = negativeClamp(Math.abs(velocity.z), 0.5, 125.0);

    const entityQuaternionClone = mesh.quaternion.clone();
    const entityPositionClone = mesh.position.clone();

    const quaternionNew = new THREE.Quaternion();
    const vector3New = new THREE.Vector3();
    const entityQuaternionCloneClone = entityQuaternionClone.clone();

    const acc = acceleration.clone();

    if (input.shift) {
      acc.multiplyScalar(2.0);
    }

    if (input.axis1Forward) {
      vector3New.set(1, 0, 0);
      quaternionNew.setFromAxisAngle(
        vector3New,
        Math.PI * timeElapsedS * acc.y * input.axis1Forward
      );
      entityQuaternionCloneClone.multiply(quaternionNew);
    }

    if (input.axis1Side) {
      vector3New.set(0, 1, 0);
      quaternionNew.setFromAxisAngle(vector3New, Math.PI * timeElapsedS * acc.y * input.axis1Side);
      entityQuaternionCloneClone.multiply(quaternionNew);
    }

    const forward = this.normalizedVector3Z.clone();
    forward.applyQuaternion(entityQuaternionClone);
    forward.normalize();

    const sideways = this.normalizedVector3X.clone();
    sideways.applyQuaternion(entityQuaternionClone);
    sideways.normalize();

    forward.multiplyScalar(velocity.z * timeElapsedS);
    sideways.multiplyScalar(velocity.x * timeElapsedS);

    entityPositionClone.add(forward);
    entityPositionClone.add(sideways);

    mesh.position.set(entityPositionClone.x, entityPositionClone.y, entityPositionClone.z);

    mesh.quaternion.copy(entityQuaternionCloneClone);
  }
};
