import type {
  BufferAttribute,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
  Quaternion,
  Vector,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import type {KeysInput} from './';

export class Component {
  public data: ComponentData | SingletonComponentsData;
  type: ExtractRecordValue<typeof bitMaskToComponentLabel>;
  bitMask: keyof typeof bitMaskToComponentLabel;

  constructor({
    data,
    bitMask,
  }: {
    data: ComponentData | SingletonComponentsData;
    bitMask: keyof typeof bitMaskToComponentLabel;
  }) {
    this.data = data;
    this.bitMask = bitMask;
    this.type = bitMaskToComponentLabel[this.bitMask];
  }
}

export type ExtractRecordValue<T> = T extends infer U ? U[keyof U] : never;

export const bitMasks = {
  keysInput: 2,
  mouse: 4,
  mesh: 8,
  movement: 16, //[velocityMove, accelerationMove, decelerationMove, velocityRotation accelerationRotation, decelerationRotation] [x y z, x y z, x y z, x y z, x y z, x y z]
  renderable: 32,
  camera: 64,
  eventsContainer: 128,
  instancedMesh: 256,
} as const;

export type BitMasks = typeof bitMasks;

type BitMaskToComponentLabel = Record<ExtractRecordValue<typeof bitMasks>, keyof typeof bitMasks>;

export const bitMaskToComponentLabel: BitMaskToComponentLabel = {
  2: 'keysInput',
  4: 'mouse',
  8: 'mesh',
  16: 'movement',
  32: 'renderable',
  64: 'camera',
  128: 'eventsContainer',
  256: 'instancedMesh',
} as const;

export type BitMaskToTypes = {
  2: KeysInput;
  4: Vector2;
  8: Mesh;
  16: MovementComponentData;
  32: boolean;
  64: CameraComponentData;
  128: 'eventsContainer';
  256: 'instancedMesh';
};

export type CameraComponentData = {
  position: Vector3;
  quaternion: Quaternion;
  idealOffset: Vector3;
  lookAt: Object3D;
  lerpCoefficient: number;
  slerpCoefficient: number;
};

export type MovementComponentData = [
  'air-craft', // type
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

export type SingletonComponentsData = KeysInput;

export type ComponentData =
  | MovementComponentData
  | CameraComponentData
  | boolean
  | number
  | Object3D
  | Vector3[]
  | Float32BufferAttribute
  | BufferAttribute
  | Mesh
  | Group
  | Vector3
  | Vector2
  | Vector4
  | Vector
  | Quaternion
  | {
      x: number;
      y: number;
    }[]
  | string[]
  | InstancedMesh;
