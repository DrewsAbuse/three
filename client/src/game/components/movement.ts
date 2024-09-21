import type {Vector3} from 'three';

export type MovementComponentData = readonly [
  Vector3, // velocityMove
  Vector3, // accelerationMove
  Vector3, // decelerationMove
  Vector3, // velocityRotation
  Vector3, // accelerationRotation
  Vector3, // decelerationRotation
];

export const movementComponentDataIndexes = {
  velocityMove: 0,
  accelerationMove: 1,
  decelerationMove: 2,
  velocityRotation: 3,
  accelerationRotation: 4,
  decelerationRotation: 5,
} as const;
