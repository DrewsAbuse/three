import type {ControlsValue} from '../keys-input.ts';
import type {ClientWorld} from '../ecs.ts';
import {componentTypeToBitMask} from '../component.ts';

export const inputSystem = function (this: ClientWorld) {
  this.controlsValue.axis1Forward = 0.0;
  this.controlsValue.axis1Side = 0.0;
  this.controlsValue.shift = false;

  if (this.keySets.keySetDown.has('KeyW')) {
    this.controlsValue.axis1Forward = 1.0;
  }

  if (this.keySets.keySetDown.has('KeyS')) {
    this.controlsValue.axis1Forward = -1.0;
  }

  if (this.keySets.keySetDown.has('KeyA')) {
    this.controlsValue.axis1Side = 1.0;
  }

  if (this.keySets.keySetDown.has('KeyD')) {
    this.controlsValue.axis1Side = -1.0;
  }

  if (this.keySets.keySetDown.has('ShiftLeft')) {
    this.controlsValue.shift = true;
  }

  const archetypePartition = this.getArchetypePartitionByComponentsMasks([
    componentTypeToBitMask.keys,
  ]);
  const componentsBitMaskToIndex = archetypePartition[1];
  const entityLength = archetypePartition[2];

  const keysComponentIndex = componentsBitMaskToIndex[componentTypeToBitMask.keys];

  for (let i = this.partitionDefaultsOffset; i < archetypePartition.length; i += entityLength) {
    (archetypePartition[i + keysComponentIndex] as ControlsValue) = this.controlsValue;
  }
};
