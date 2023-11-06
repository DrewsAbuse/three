import type {
  BufferAttribute,
  Float32BufferAttribute,
  Group,
  Mesh,
  Quaternion,
  Vector,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import type {ControlsValue} from './keys-input.ts';

export const componentTypeToBitMask = {
  keys: 2,
  mouse: 4,
  mesh: 8,
  position: 16,
  velocity: 32,
  renderable: 64,
  acceleration: 128,
  decceleration: 256,
  camera: 512,
  radius: 1024,
} as const;

type BitMaskToComponentType = Record<
  ExtractRecordValue<typeof componentTypeToBitMask>,
  keyof typeof componentTypeToBitMask
>;

export const bitMaskToComponentType: BitMaskToComponentType = {
  2: 'keys',
  4: 'mouse',
  8: 'mesh',
  16: 'position',
  32: 'velocity',
  64: 'renderable',
  128: 'acceleration',
  256: 'decceleration',
  512: 'camera',
  1024: 'radius',
} as const;

export type Data =
  | number
  | ControlsValue
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
    };

type ExtractRecordValue<T> = T extends infer U ? U[keyof U] : never;

export class Component {
  public data: Data;
  type: ExtractRecordValue<typeof bitMaskToComponentType>;
  bitMask: keyof typeof bitMaskToComponentType;

  constructor({data, bitMask}: {data: Data; bitMask: keyof typeof bitMaskToComponentType}) {
    this.data = data;
    this.bitMask = bitMask;
    this.type = bitMaskToComponentType[this.bitMask];
  }
}
