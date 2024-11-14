import type {ComponentsData} from '../components';

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
export type ComponentIds = Readonly<Uint16Array>;
export type EntityInputs = {componentIds: ComponentIds; entities: EntityArray[]};
export type EntityInput = {entityArray: EntityArray; componentsId: Uint16Array};

export type TickParams = {
  systemStep: number;
  partition: ArchetypePartition;
  idToComponentOffset: ComponentsIndexesOffset;
  entityStartOffset: number;
  lastLiveEntityIndex: number;
  entityLength: number;
};
export type ExtractRecordValue<T> = T extends infer U ? U[keyof U] : never;
