import {type Mesh, Quaternion, Vector3} from 'three';
import type {ComponentIdToTypes} from '../../components';
import type {TickParams} from '../../types';
import {normalizedVec3} from '../../helpers';
import {SubSystem, System} from '../base.ts';
import {movementComponentDataIndexes} from '../../components';
import {componentIds} from '../../components';
import {MovementInputSystem} from './input.ts';

const SYSTEM_REQUIRED_COMPONENTS = new Uint16Array([
  componentIds.keysInput,
  componentIds.mesh,
  componentIds.movement,
  componentIds.camera,
]);

export class MovementsWithKeysInputSystemRunner extends System {
  movementInputSystem: {
    'air-craft': MovementInputSystem;
  };
  movementSystem: MovementAndRotationSystem;
  positionBefore: Vector3 = new Vector3();

  constructor() {
    super({
      requiredComponents: SYSTEM_REQUIRED_COMPONENTS,
    });
    this.movementSystem = new MovementAndRotationSystem();
    this.movementInputSystem = {
      'air-craft': new MovementInputSystem(),
    };
  }

  componentsIndexes = {
    movement: movementComponentDataIndexes,
  } as const;

  updateTick({partition, idToComponentOffset, index, systemStep}: TickParams) {
    const keysComponentOffset = idToComponentOffset[componentIds.keysInput];
    const meshComponentOffset = idToComponentOffset[componentIds.mesh];
    const movementComponentOffset = idToComponentOffset[componentIds.movement];

    const movementComponentData = partition[
      index + movementComponentOffset
    ] as ComponentIdToTypes[componentIds.movement];

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
    ] as ComponentIdToTypes[componentIds.keysInput];

    this.movementInputSystem['air-craft'].update({
      timeElapsedS: systemStep,
      props: {
        keyDownToBoolMap,
        rotationVelocity,
        rotationAcceleration,
        moveVelocity,
        moveAcceleration,
      },
    });

    this.movementSystem.update({
      timeElapsedS: systemStep,
      props: {
        mesh: partition[index + meshComponentOffset] as ComponentIdToTypes[componentIds.mesh],
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
