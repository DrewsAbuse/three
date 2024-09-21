import type {Object3D, Quaternion, Vector3} from 'three';

export type CameraComponentData = {
  position: Vector3;
  quaternion: Quaternion;
  idealOffset: Vector3;
  lookAt: Object3D;
  lerpCoefficient: number;
  slerpCoefficient: number;
};
