import type {Vector3} from 'three';

type MoveVelocity = Vector3;
type MoveAcceleration = Vector3;
type MoveDeceleration = Vector3;

type RotationVelocity = Vector3;
type RotationAcceleration = Vector3;
type RotationDeceleration = Vector3;

export type MovementComponentData = [
  MoveVelocity,
  MoveAcceleration,
  MoveDeceleration,
  RotationVelocity,
  RotationAcceleration,
  RotationDeceleration,
];

export const movementComponentDataIndexes = {
  velocityMove: 0,
  accelerationMove: 1,
  decelerationMove: 2,
  velocityRotation: 3,
  accelerationRotation: 4,
  decelerationRotation: 5,
} as const;
