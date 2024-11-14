import {Quaternion, Vector3} from 'three';
import type {ComponentIdToData} from '../../components';
import type {TickParams} from '../../types';
import {SpatialHashGrid, normalizedVec3} from '../../helpers';
import {System} from '../base.ts';
import {componentIdsEnum, movementComponentDataIndexes} from '../../components';
import {MovementInputSystem} from './input.ts';

const SYSTEM_REQUIRED_COMPONENTS = new Uint16Array([
  componentIdsEnum.keysInput,
  componentIdsEnum.mesh,
  componentIdsEnum.movement,
  componentIdsEnum.camera,
]);

export class MovementsWithKeysInputSystemRunner extends System {
  movementInputSystem: {
    'air-craft': MovementInputSystem;
  };
  positionBefore: Vector3 = new Vector3();

  frameDeceleration = new Vector3();
  quaternionContainer = new Quaternion();
  grid: SpatialHashGrid;

  constructor(grid: SpatialHashGrid) {
    super({
      requiredComponents: SYSTEM_REQUIRED_COMPONENTS,
    });
    this.grid = grid;
    this.movementInputSystem = {
      'air-craft': new MovementInputSystem(),
    };
  }

  componentsIndexes = {
    movement: movementComponentDataIndexes,
  } as const;

  updateTick({
    partition,
    idToComponentOffset,
    entityLength,
    entityStartOffset,
    lastLiveEntityIndex,
    systemStep,
  }: TickParams) {
    const keysComponentOffset = idToComponentOffset[componentIdsEnum.keysInput];
    const meshComponentOffset = idToComponentOffset[componentIdsEnum.mesh];
    const movementComponentOffset = idToComponentOffset[componentIdsEnum.movement];

    for (let index = entityStartOffset; index <= lastLiveEntityIndex; index += entityLength) {
      const movementComponentData = partition[
        index + movementComponentOffset
      ] as ComponentIdToData[componentIdsEnum.movement];

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
      ] as ComponentIdToData[componentIdsEnum.keysInput];

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

      const mesh = partition[
        index + meshComponentOffset
      ] as ComponentIdToData[componentIdsEnum.mesh];

      this.positionBefore.x = mesh.position.x;
      this.positionBefore.y = mesh.position.y;
      this.positionBefore.z = mesh.position.z;

      //Rotation
      this.frameDeceleration.set(
        rotationVelocity.x * rotationDeceleration.x * systemStep,
        rotationVelocity.y * rotationDeceleration.y * systemStep,
        rotationVelocity.z * rotationDeceleration.z * systemStep
      );
      rotationVelocity.add(this.frameDeceleration);

      this.quaternionContainer.setFromAxisAngle(
        normalizedVec3.normalizedVector3X,
        Math.PI * rotationVelocity.x * systemStep
      );
      mesh.quaternion.multiply(this.quaternionContainer);

      this.quaternionContainer.setFromAxisAngle(
        normalizedVec3.normalizedVector3Z,
        Math.PI * rotationVelocity.z * systemStep
      );
      mesh.quaternion.multiply(this.quaternionContainer);

      this.quaternionContainer.setFromAxisAngle(
        normalizedVec3.normalizedVector3Y,
        Math.PI * rotationVelocity.y * systemStep
      );
      mesh.quaternion.multiply(this.quaternionContainer);

      //Directional movement
      this.frameDeceleration.set(0, 0, moveVelocity.z * moveDeceleration.z * systemStep);
      moveVelocity.add(this.frameDeceleration);

      mesh.position.add(moveVelocity.clone().applyQuaternion(mesh.quaternion));

      if (!this.positionBefore.equals(mesh.position)) {
        this.grid.move(mesh, this.positionBefore);
      }

      this.quaternionContainer.set(0, 0, 0, 1);
      this.frameDeceleration.set(0, 0, 0);
    }
  }
}
