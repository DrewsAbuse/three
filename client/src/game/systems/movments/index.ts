import type {ArchetypePartition} from '../../world';
import type {BitMaskToTypes, BitMasks} from '../../entities/components/component.ts';
import {movementComponentDataIndexes} from '../../entities/components/component.ts';
import {partitionConstants} from '../../world';
import {bitMasks} from '../../entities/components/component.ts';
import {AriCraftMovementSystem} from './air-craft.ts';

const SYSTEM_REQUIRED_COMPONENTS = [
  bitMasks.keysInput,
  bitMasks.mesh,
  bitMasks.movement,
  bitMasks.camera,
] as const;

export class MovementsSystemRunner {
  requiredComponents = SYSTEM_REQUIRED_COMPONENTS;
  movementTypeToSystem: {
    'air-craft': AriCraftMovementSystem;
  };

  constructor() {
    this.movementTypeToSystem = {
      'air-craft': new AriCraftMovementSystem(this.requiredComponents),
    };
  }

  componentsIndexes = {
    movement: movementComponentDataIndexes,
  } as const;

  update({
    timeElapsedS,
    archetypePartition,
  }: {
    timeElapsedS: number;
    archetypePartition: ArchetypePartition | undefined;
  }) {
    if (archetypePartition === undefined) {
      return;
    }

    const lastEntityIndex = archetypePartition[partitionConstants.lastInsertedIndex];
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

      const moveVelocity = movementComponentData[this.componentsIndexes.movement.velocityMove];
      const moveAcceleration =
        movementComponentData[this.componentsIndexes.movement.accelerationMove];
      const moveDeceleration =
        movementComponentData[this.componentsIndexes.movement.decelerationMove];

      const movementType = movementComponentData[movementComponentDataIndexes.movementType];
      const {keyDownToBoolMap} = archetypePartition[
        i + keysComponentOffset
      ] as BitMaskToTypes[BitMasks['keysInput']];
      const mesh = archetypePartition[i + meshComponentOffset] as BitMaskToTypes[BitMasks['mesh']];

      this.movementTypeToSystem[movementType].update({
        timeElapsedS,
        props: {
          keyDownToBoolMap,
          mesh,
          rotationVelocity,
          rotationAcceleration,
          rotationDeceleration,
          moveVelocity,
          moveAcceleration,
          moveDeceleration,
        },
      });
    }
  }
}
