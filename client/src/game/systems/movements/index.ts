import {Vector3} from 'three';
import type {ComponentIdToTypes} from '../../components';
import type {TickParams} from '../../types.ts';
import {movementComponentDataIndexes} from '../../components';
import {componentsId} from '../../components';
import {CubesMovementInputSystem} from './cubes.ts';
import {MovementInputSystem} from './input.ts';
import {MovementAndRotationSystem} from './move.ts';

const SYSTEM_REQUIRED_COMPONENTS = new Uint16Array([
  componentsId.keysInput,
  componentsId.mesh,
  componentsId.movement,
  componentsId.camera,
]);

export class MovementsSystemRunner {
  requiredComponents = SYSTEM_REQUIRED_COMPONENTS;
  movementInputSystem: {
    'air-craft': MovementInputSystem;
    cube: CubesMovementInputSystem;
  };
  movementSystem: MovementAndRotationSystem;
  positionBefore: Vector3 = new Vector3();

  constructor() {
    this.movementSystem = new MovementAndRotationSystem();
    this.movementInputSystem = {
      'air-craft': new MovementInputSystem(),
      cube: new CubesMovementInputSystem(),
    };
  }

  componentsIndexes = {
    movement: movementComponentDataIndexes,
  } as const;

  updateTick({partition, idToComponentOffset, index, timeElapsed, now}: TickParams) {
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

    const movementType = movementComponentData[this.componentsIndexes.movement.movementType];

    const {keyDownToBoolMap} = partition[
      index + keysComponentOffset
    ] as ComponentIdToTypes[componentsId.keysInput];

    this.movementInputSystem[movementType].update({
      timeElapsedS: timeElapsed,
      props: {
        keyDownToBoolMap,
        rotationVelocity,
        rotationAcceleration,
        moveVelocity,
        moveAcceleration,
        dateMs: now,
      },
    });

    const mesh = partition[index + meshComponentOffset] as ComponentIdToTypes[componentsId.mesh];

    this.positionBefore.copy(mesh.position);

    this.movementSystem.update({
      timeElapsedS: timeElapsed,
      props: {
        mesh,
        rotationVelocity,
        rotationDeceleration,
        moveVelocity,
        moveDeceleration,
      },
    });
  }
}
