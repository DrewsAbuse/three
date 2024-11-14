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
import type {ArchetypePartition} from '../types';

export enum componentIdsEnum {
  keysInput = 1,
  mouse,
  mesh,
  movement, //[velocityMove, accelerationMove, decelerationMove, velocityRotation accelerationRotation, decelerationRotation] [x y z, x y z, x y z, x y z, x y z, x y z]
  renderable,
  camera,
  eventsContainer,
  instancedMesh,
  collision,
  uiWrite,
  uiRead,
}

type Renderable = true;

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

export type ComponentIdToData = {
  1: KeysInput;
  2: Vector2;
  3: Mesh;
  4: MovementComponentData;
  5: Renderable; // renderable
  6: CameraComponentData;
  //128: 'eventsContainer';
  8: InstancedMesh;
  9: UIRead;
  10: UIWrite;
  [key: number]: ComponentsData | SingletonComponentsData;
};

export type ComponentKeys = keyof typeof componentIdToLabel;

//const SINGLETON_COMPONENTS_IDS = [componentIdsEnum.keysInput]; //TODO: use typed keys of

export abstract class ComponentBase<
  RecordIdToComponentArrayData extends Record<number, unknown>,
  ComponentId extends keyof RecordIdToComponentArrayData,
  Data = RecordIdToComponentArrayData[ComponentId],
> {
  public data: Data;
  public id: ComponentId;

  constructor({data, id}: {data: Data; id: ComponentId}) {
    this.data = data;
    this.id = id;
  }
}

export class Component<ComponentId extends number = number> extends ComponentBase<
  ComponentIdToData,
  ComponentId
> {
  constructor({data, id}: {data: ComponentsData; id: ComponentId}) {
    super({data, id});
  }
}

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
