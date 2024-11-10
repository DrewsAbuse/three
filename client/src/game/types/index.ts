import type {ComponentsData} from '../components';
import {ComponentIdToMeta, PartitionBufferStoreBase} from '../storage/buffer.ts';

type IsEntityDeleted = 0 | 1;
type IsEntityDirty = 0 | 1;
type EntityId = number;
export type EntityArray = [EntityId, IsEntityDeleted, IsEntityDirty, ...ComponentsData[]];
export type ComponentsIndexesOffset = Record<number, number>;
type CurrentFilledIndex = number; //Must be used for swapping elements instead of delete and concatenation
type EntityLength = number;
export type TwoDimensionalArray = [
  CurrentFilledIndex,
  ComponentsIndexesOffset,
  EntityLength,
  ...EntityArray,
][];
export type ArchetypePartition = TwoDimensionalArray[number];
export type EntityInput = {entityArray: EntityArray; componentsId: Uint16Array};
export type ComponentIds = Readonly<Uint16Array>;
export type EntityInputs = {componentIds: ComponentIds; entities: EntityArray[]};

export type EntityInputV2 = {
  entityArray: Float64Array;
  componentIds: Uint16Array;
  shape: ComponentIdToMeta;
};

export type EntityInputsV2 = {
  componentIds: ComponentIds;
  entities: Float64Array[];
  shape: ComponentIdToMeta;
};

export type TickParams = {
  systemStep: number;
  partition: PartitionBufferStoreBase;
};
export type ExtractRecordValue<T> = T extends infer U ? U[keyof U] : never;
