import type {Object3D, Quaternion, Vector3} from 'three';

/**
 * @description {Array} CameraComponentData `[position, quaternion, idealOffset, lookAt, lerpCoefficient, slerpCoefficient]`
 */
export type CameraComponentData = [
  Vector3, // position
  Quaternion, // quaternion
  Vector3, // idealOffset
  Object3D, // lookAt
  number, // lerpCoefficient
  number, // slerpCoefficient
];
export const cameraComponentDataIndexes = {
  position: 0,
  quaternion: 1,
  idealOffset: 2,
  lookAt: 3,
  lerpCoefficient: 4,
  slerpCoefficient: 5,
} as const;
