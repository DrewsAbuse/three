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
import type {ArchetypePartition, ExtractRecordValue} from '../types';
import {Signal} from "../../GUI";

export enum componentIds {
  keysInput = 1,
  mouse,
  mesh,
  movement, //[velocityMove, accelerationMove, decelerationMove, velocityRotation accelerationRotation, decelerationRotation] [x y z, x y z, x y z, x y z, x y z, x y z]
  renderable,
  camera,
  eventsContainer,
  instancedMesh,
  uiWrite,
  uiRead,
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
  9: 'uiWrite',
  10: 'uiRead',
} as const;

export type ComponentIdToTypes = {
  1: KeysInput;
  2: Vector2;
  3: Mesh;
  4: MovementComponentData;
  5: Renderable; // renderable
  6: CameraComponentData;
  //128: 'eventsContainer';
  8: InstancedMesh;
  9: UIWrite;
  10: UIRead;
  [key: number]: ComponentsData | SingletonComponentsData;
};

type ComponentKeys = keyof typeof componentIdToLabel;
type Labels = ExtractRecordValue<typeof componentIdToLabel>;

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

type SingletonComponentsData = KeysInput;

type SignalId = string;

type UIWriteSetter = {
  updateId: number;
  setter: (params: {
    value: unknown;
    partition: ArchetypePartition;
    idToComponentOffset: Record<number, number>;
    index: number;
  }) => void;
};

type UIWrite = {
  signalIds: SignalId[];
  signalIdToSetter: Record<SignalId, UIWriteSetter>;
};
type UIRead = true;

type Renderable = true;

export type ComponentLabelToTypes = {
  keysInput: KeysInput;
  mouse: Vector2;
  mesh: Mesh;
  movement: MovementComponentData;
  renderable: Renderable;
  camera: CameraComponentData;
  //128: 'eventsContainer';
  instancedMesh: InstancedMesh;
  uiWrite: UIWrite;
  uiRead: UIRead;
  [key: string]: ComponentsData | SingletonComponentsData;
};

export type ComponentsData =
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
  | InstancedMesh
  | UIWrite;
