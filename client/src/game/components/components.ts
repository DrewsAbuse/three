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
import type {KeysInput, MovementComponentData} from './';
import type {CameraComponentData} from './camera.ts';
import type {ExtractRecordValue} from '../types.ts';

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
