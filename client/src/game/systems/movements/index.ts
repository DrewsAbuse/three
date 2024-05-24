import {Vector3} from 'three';
import type {ArchetypePartition} from '../../world';
import type {BitMaskToTypes, BitMasks} from '../../components';
import type {SpatialHashGrid} from '../../helpers/grid.ts';
import {partitionConstants} from '../../world';
import {bitMasks, movementComponentDataIndexes} from '../../components';
import {CubesMovementInputSystem} from './cubes.ts';
import {MovementInputSystem} from './input.ts';
import {MovementAndRotationSystem} from './move.ts';

const SYSTEM_REQUIRED_COMPONENTS = [
  bitMasks.keysInput,
  bitMasks.mesh,
  bitMasks.movement,
  bitMasks.camera,
] as const;

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

  update({
    timeElapsedS,
    archetypePartition,
    grid,
  }: {
    timeElapsedS: number;
    archetypePartition: ArchetypePartition | undefined;
    grid: SpatialHashGrid;
  }) {
    if (archetypePartition === undefined) {
      return;
    }

    const dateMs = new Date().getTime();

    const lastEntityIndex = archetypePartition[partitionConstants.lastNotDeletedEntityIndex];
    const componentsIndexes = archetypePartition[partitionConstants.componentsIndexesOffset];
    const entityLength = archetypePartition[partitionConstants.entityLengthOffset];

    const keysComponentOffset = componentsIndexes[bitMasks.keysInput];
    const meshComponentOffset = componentsIndexes[bitMasks.mesh];
    const movementComponentOffset = componentsIndexes[bitMasks.movement];

    for (let i = partitionConstants.entityLengthOffset; i < lastEntityIndex; i += entityLength) {
      const movementComponentData = archetypePartition[
        i + movementComponentOffset
      ] as BitMaskToTypes[BitMasks['movement']];

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

      const movementType = movementComponentData[movementComponentDataIndexes.movementType];

      const {keyDownToBoolMap} = archetypePartition[
        i + keysComponentOffset
      ] as BitMaskToTypes[BitMasks['keysInput']];

      this.movementInputSystem[movementType].update({
        timeElapsedS,
        props: {
          keyDownToBoolMap,
          rotationVelocity,
          rotationAcceleration,
          moveVelocity,
          moveAcceleration,
          dateMs,
        },
      });

      const mesh = archetypePartition[i + meshComponentOffset] as BitMaskToTypes[BitMasks['mesh']];

      this.positionBefore.copy(mesh.position);

      this.movementSystem.update({
        timeElapsedS,
        props: {
          mesh,
          rotationVelocity,
          rotationDeceleration,
          moveVelocity,
          moveDeceleration,
        },
      });

      if (this.positionBefore.equals(mesh.position)) {
        continue;
      }

      grid.move(mesh, this.positionBefore);
    }
  }
}
