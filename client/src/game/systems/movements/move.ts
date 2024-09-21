import {type Mesh, Quaternion, Vector3} from 'three';
import type {ComponentIdToTypes} from '../../components';
import type {TickParams} from '../../types.ts';
import {normalizedVec3} from '../../helpers';
import {SubSystem} from '../base.ts';
import {movementComponentDataIndexes} from '../../components';
import {componentsId} from '../../components';
import {MovementInputSystem} from './input.ts';

const SYSTEM_REQUIRED_COMPONENTS = new Uint16Array([
  componentsId.keysInput,
  componentsId.mesh,
  componentsId.movement,
  componentsId.camera,
]);

export class MovementsWithKeysInputSystemRunner {
  requiredComponents = SYSTEM_REQUIRED_COMPONENTS;
  movementInputSystem: {
    'air-craft': MovementInputSystem;
  };
  movementSystem: MovementAndRotationSystem;
  positionBefore: Vector3 = new Vector3();

  constructor() {
    this.movementSystem = new MovementAndRotationSystem();
    this.movementInputSystem = {
      'air-craft': new MovementInputSystem(),
    };
  }

  componentsIndexes = {
    movement: movementComponentDataIndexes,
  } as const;

  updateTick({partition, idToComponentOffset, index, timeElapsed}: TickParams) {
    const keysComponentOffset = idToComponentOffset[componentsId.keysInput];
    const meshComponentOffset = idToComponentOffset[componentsId.mesh];
    const movementComponentOffset = idToComponentOffset[componentsId.movement];

    const movementComponentData = partition[
      index + movementComponentOffset
    ] as ComponentIdToTypes[componentsId.movement];

    const rotationVelocity =
      movementComponentData[this.componentsIndexes.movement.velocityRotation];
    const rotationAcceleration =
      movementComponentData[this.componentsIndexes.movement.accelerationRotation];

    const rotationDeceleration =
      movementComponentData[this.componentsIndexes.movement.decelerationRotation];
    const moveDeceleration =
      movementComponentData[this.componentsIndexes.movement.decelerationMove];

    const moveVelocity = movementComponentData[this.componentsIndexes.movement.velocityMove];
    const moveAcceleration =
      movementComponentData[this.componentsIndexes.movement.accelerationMove];

    const {keyDownToBoolMap} = partition[
      index + keysComponentOffset
    ] as ComponentIdToTypes[componentsId.keysInput];

    this.movementInputSystem['air-craft'].update({
      timeElapsedS: timeElapsed,
      props: {
        keyDownToBoolMap,
        rotationVelocity,
        rotationAcceleration,
        moveVelocity,
        moveAcceleration,
      },
    });

    this.movementSystem.update({
      timeElapsedS: timeElapsed,
      props: {
        mesh: partition[index + meshComponentOffset] as ComponentIdToTypes[componentsId.mesh],
        rotationVelocity,
        rotationDeceleration,
        moveVelocity,
        moveDeceleration,
      },
    });
  }
}

export class MovementAndRotationSystem extends SubSystem {
  frameDeceleration = new Vector3();
  quaternionContainer = new Quaternion();

  update({
    timeElapsedS,
    props: {mesh, rotationVelocity, rotationDeceleration, moveVelocity, moveDeceleration},
  }: {
    timeElapsedS: number;
    props: {
      mesh: Mesh;
      rotationVelocity: Vector3;
      rotationDeceleration: Vector3;
      moveVelocity: Vector3;
      moveDeceleration: Vector3;
    };
  }) {
    //Rotation
    this.frameDeceleration.set(
      rotationVelocity.x * rotationDeceleration.x * timeElapsedS,
      rotationVelocity.y * rotationDeceleration.y * timeElapsedS,
      rotationVelocity.z * rotationDeceleration.z * timeElapsedS
    );
    rotationVelocity.add(this.frameDeceleration);

    this.quaternionContainer.setFromAxisAngle(
      normalizedVec3.normalizedVector3X,
      Math.PI * rotationVelocity.x * timeElapsedS
    );
    mesh.quaternion.multiply(this.quaternionContainer);

    this.quaternionContainer.setFromAxisAngle(
      normalizedVec3.normalizedVector3Z,
      Math.PI * rotationVelocity.z * timeElapsedS
    );
    mesh.quaternion.multiply(this.quaternionContainer);

    this.quaternionContainer.setFromAxisAngle(
      normalizedVec3.normalizedVector3Y,
      Math.PI * rotationVelocity.y * timeElapsedS
    );
    mesh.quaternion.multiply(this.quaternionContainer);

    //Directional movement
    this.frameDeceleration.set(0, 0, moveVelocity.z * moveDeceleration.z * timeElapsedS);
    moveVelocity.add(this.frameDeceleration);

    mesh.position.add(moveVelocity.clone().applyQuaternion(mesh.quaternion));

    this.quaternionContainer.set(0, 0, 0, 1);
    this.frameDeceleration.set(0, 0, 0);
  }
}
