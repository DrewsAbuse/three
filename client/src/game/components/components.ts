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

export class Component<T extends ComponentKeys = ComponentKeys> {
  public data: ComponentIdToTypes[T];
  public key: Labels;
  public id: ComponentKeys;

  constructor({data, id}: {data: ComponentIdToTypes[T]; id: T}) {
    this.data = data;
    this.id = id;
    this.key = componentIdToLabel[id];
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

export enum componentsId {
  keysInput = 1,
  mouse,
  mesh,
  movement, //[velocityMove, accelerationMove, decelerationMove, velocityRotation accelerationRotation, decelerationRotation] [x y z, x y z, x y z, x y z, x y z, x y z]
  renderable,
  camera,
  eventsContainer,
  instancedMesh,
}

export const componentIdToLabel = {
  1: 'keysInput',
  2: 'mouse',
  3: 'mesh',
  4: 'movement',
  5: 'renderable',
  6: 'camera',
  7: 'eventsContainer',
  8: 'instancedMesh',
} as const;

type ComponentKeys = keyof typeof componentIdToLabel;

type Labels = ExtractRecordValue<typeof componentIdToLabel>;

export const componentLabels = (() =>
  Object.entries(componentIdToLabel).reduce<Labels[]>(
    (acc, [, label]) => {
      acc.push(label);

      return acc;
    },
    ['empty'] as unknown as Labels[]
  ))();

export type ComponentIdToTypes = {
  1: KeysInput;
  2: Vector2;
  3: Mesh;
  4: MovementComponentData;
  5: boolean;
  6: CameraComponentData;
  //128: 'eventsContainer';
  8: InstancedMesh;
  [key: number]: ComponentData | SingletonComponentsData;
};

export type ComponentLabelToTypes = {
  keysInput: KeysInput;
  mouse: Vector2;
  mesh: Mesh;
  movement: MovementComponentData;
  renderable: boolean;
  camera: CameraComponentData;
  //128: 'eventsContainer';
  instancedMesh: InstancedMesh;
  [key: string]: ComponentData | SingletonComponentsData;
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
  'air-craft' | 'cube', // type
  Vector3, // velocityMove
  Vector3, // accelerationMove
  Vector3, // decelerationMove
  Vector3, // velocityRotation
  Vector3, // accelerationRotation
  Vector3, // decelerationRotation
];

export type SingletonComponentsData = KeysInput;

export type ComponentData =
  | KeysInput
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
