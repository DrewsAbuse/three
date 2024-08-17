import type {Vector3} from 'three';

export type MovementComponentData = readonly [
  'air-craft' | 'cube', // type
  Vector3, // velocityMove
  Vector3, // accelerationMove
  Vector3, // decelerationMove
  Vector3, // velocityRotation
  Vector3, // accelerationRotation
  Vector3, // decelerationRotation
];

export const movementComponentDataIndexes = {
  movementType: 0,
  velocityMove: 1,
  accelerationMove: 2,
  decelerationMove: 3,
  velocityRotation: 4,
  accelerationRotation: 5,
  decelerationRotation: 6,
} as const;
