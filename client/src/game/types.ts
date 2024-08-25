import type {ComponentData} from './components';

type IsEntityDeleted = 0 | 1;
type IsEntityDirty = 0 | 1;
type EntityId = number;
export type EntityArray = [EntityId, IsEntityDeleted, IsEntityDirty, ...ComponentData[]];
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
export type EntityInputs = {componentsId: ComponentIds; entities: EntityArray[]};
export type EntityInput = {entityArray: EntityArray; componentsId: Uint16Array};
export type ComponentIds = Readonly<Uint16Array>;

export type TickParams = {
  timeElapsed: number;
  now: number;
  partition: ArchetypePartition;
  idToComponentOffset: ComponentsIndexesOffset;
  index: number;
};
export type ApplyTick = (params: TickParams) => void;
