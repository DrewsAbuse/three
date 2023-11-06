import * as THREE from 'three';
import type {ControlsValue} from '../keys-input.ts';
import type {Vector3} from 'three';
import type {World} from '../ecs.ts';
import {componentTypeToBitMask} from '../component.ts';
import {negativeClamp} from '../helpers';

export const movementSystem = function (this: World, timeElapsedS: number) {
  const archetypePartition = this.getArchetypePartitionByStrictComponentsMask([
    componentTypeToBitMask.keys,
    componentTypeToBitMask.mesh,
    componentTypeToBitMask.velocity,
    componentTypeToBitMask.acceleration,
    componentTypeToBitMask.decceleration,
  ]);
  const componentsIndexes = archetypePartition[1];
  const entityLength = archetypePartition[2];

  const vector3Tmp = new THREE.Vector3(0, 0, 0);
  vector3Tmp.multiplyScalar(timeElapsedS);

  const keysComponentOffset = componentsIndexes[componentTypeToBitMask.keys];
  const meshComponentOffset = componentsIndexes[componentTypeToBitMask.mesh];
  const velocityComponentOffset = componentsIndexes[componentTypeToBitMask.velocity];
  const accelerationComponentOffset = componentsIndexes[componentTypeToBitMask.acceleration];
  const deccelerationComponentOffset = componentsIndexes[componentTypeToBitMask.decceleration];

  for (let i = this.partitionDefaultsOffset; i < archetypePartition.length; i += entityLength) {
    const input = archetypePartition[i + keysComponentOffset] as ControlsValue;
    const mesh = archetypePartition[i + meshComponentOffset] as THREE.Mesh;
    const velocity = archetypePartition[i + velocityComponentOffset] as Vector3;
    const deacceleration = archetypePartition[i + accelerationComponentOffset] as Vector3;
    const acceleration = archetypePartition[i + deccelerationComponentOffset] as Vector3;

    const frameDeacceleration = new THREE.Vector3(
      velocity.x * deacceleration.x,
      velocity.y * deacceleration.y,
      velocity.z * deacceleration.z
    );
    frameDeacceleration.multiplyScalar(timeElapsedS);
    velocity.add(frameDeacceleration);
    velocity.z = negativeClamp(Math.abs(velocity.z), 5, 150);

    const entityQuaternionClone = mesh.quaternion.clone();
    const entityPositionClone = mesh.position.clone();

    const quaternionNew = new THREE.Quaternion();
    const vector3New = new THREE.Vector3();
    const entityQuaternionCloneClone = entityQuaternionClone.clone();

    const acc = acceleration.clone();

    if (input.shift) {
      acc.z = -0.05;
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

    forward.multiplyScalar(acc.z + velocity.z * timeElapsedS);
    sideways.multiplyScalar(velocity.x * timeElapsedS);

    entityPositionClone.add(forward);
    entityPositionClone.add(sideways);

    mesh.position.set(entityPositionClone.x, entityPositionClone.y, entityPositionClone.z);

    mesh.quaternion.copy(entityQuaternionCloneClone);

    archetypePartition[i + keysComponentOffset] = input;
    archetypePartition[i + meshComponentOffset] = mesh;
    archetypePartition[i + velocityComponentOffset] = velocity;
    archetypePartition[i + deccelerationComponentOffset] = deacceleration;
  }
};
