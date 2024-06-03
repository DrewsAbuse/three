import type {ComponentData} from '../components';
import {InvertedIndex} from '../helpers/search.ts';

type IsEntityDeleted = 0 | 1;
type IsEntityDirty = 0 | 1;
type EntityId = number;
export type EntityArray = [EntityId, IsEntityDeleted, IsEntityDirty, ...ComponentData[]];
type ComponentsIndexesOffset = Record<number, number>;
type CurrentFilledIndex = number; //Must be used for swapping elements instead of delete and concatenation
type EntityLength = number;
type TwoDimensionalArray = [
  CurrentFilledIndex,
  ComponentsIndexesOffset,
  EntityLength,
  ...EntityArray,
][];
export type ArchetypePartition = TwoDimensionalArray[number];
type MapComponentsMaskToArchetype = Map<
  number,
  {
    componentsBitMaskToPartitionIndex: Map<number, number>;
    entityIdToIndex: Map<number, number>;
    twoDimensionalArray: TwoDimensionalArray;
  }
>;

class SingletonWorldStorage {
  partitionConstants = {
    lastNotDeletedEntityIndex: 0,
    componentsIndexesOffset: 1,
    entityLengthOffset: 2,
    entityStartOffset: 3,
  } as const;

  archetypesPrefixTree = new InvertedIndex();
  mapComponentsMaskToArchetype: MapComponentsMaskToArchetype = new Map();
  archetypes: {
    componentsBitMaskToPartitionIndex: Map<number, number>;
    entityIdToIndex: Map<number, number>;
    twoDimensionalArray: TwoDimensionalArray;
  }[] = [];
  mapComponentsMaskToArchetypeIndex: Map<number, number> = new Map();
  mapComponentMaskToArchetypeMask: Map<number, number> = new Map();
  mapEntityIdToMapComponentsMask: Map<number, number> = new Map();

  //Offsets
  partitionEntityArraysStartIndex = this.partitionConstants.entityStartOffset + 1;

  createEntity({
    componentsBitMask,
    entityArray,
    sortedBitMasks,
  }: {
    componentsBitMask: number;
    entityArray: EntityArray;
    sortedBitMasks: number[];
  }) {
    let isArchetypeFound = false;
    const entityId = entityArray[0];
    const entityLength = entityArray.length;

    for (const [archetypeKeyComponentsMask, archetypeIndex] of this
      .mapComponentsMaskToArchetypeIndex) {
      const bitWise = componentsBitMask & archetypeKeyComponentsMask;

      const isWiderArchetypeMaskPassed = bitWise !== componentsBitMask && bitWise !== 0;

      if (
        (archetypeKeyComponentsMask | componentsBitMask) === archetypeKeyComponentsMask ||
        isWiderArchetypeMaskPassed
      ) {
        this.mapComponentsMaskToArchetypeIndex.set(componentsBitMask, archetypeIndex);

        isArchetypeFound = true;
        const archetype = this.archetypes[archetypeIndex];

        const archetypePartitionIndex =
          archetype.componentsBitMaskToPartitionIndex.get(componentsBitMask);

        //Fill existing partition
        if (archetypePartitionIndex !== undefined) {
          const partition = archetype.twoDimensionalArray[archetypePartitionIndex];

          let lastInsertIndex = partition[0];
          this.mapEntityIdToMapComponentsMask.set(entityId, componentsBitMask);

          lastInsertIndex += 1;
          archetype.entityIdToIndex.set(entityId, lastInsertIndex);

          for (let i = 0; i < entityArray.length; i++) {
            partition[lastInsertIndex + i] = entityArray[i];
          }

          partition[0] = lastInsertIndex + entityLength - 1;

          return;
        }

        //Create new partition
        const currentInsertIndex = this.partitionConstants.entityStartOffset;
        const partition = new Array<Record<number, number> | ComponentData>(
          this.partitionConstants.entityStartOffset + entityLength
        );
        this.mapEntityIdToMapComponentsMask.set(entityId, componentsBitMask);

        const componentsBitMaskToIndex: Record<number, number> = {};
        let partialComponentsBitMask = 0;

        archetype.entityIdToIndex.set(entityId, currentInsertIndex);

        for (let i = 0; i < sortedBitMasks.length; i++) {
          const bitMask = sortedBitMasks[i];
          partialComponentsBitMask = this.setMapComponentsMaskToArchetype(
            i,
            bitMask,
            sortedBitMasks,
            partialComponentsBitMask,
            componentsBitMask,
            componentsBitMaskToIndex
          );
        }

        partition[1] = componentsBitMaskToIndex;
        partition[2] = entityLength;

        for (let i = 0; i < entityArray.length; i++) {
          partition[currentInsertIndex + i] = entityArray[i];
        }

        //TODO - Fix this magic negative one
        partition[0] = currentInsertIndex + entityLength - 1;

        // console.log('New partition', partition);

        archetype.componentsBitMaskToPartitionIndex.set(
          componentsBitMask,
          archetype.twoDimensionalArray.push(partition as TwoDimensionalArray[number]) - 1
        );
        break;
      }
    }

    if (!isArchetypeFound) {
      this.createArchetype({
        componentsBitMask,
        entityArray,
        sortedBitMasks,
      });
    }
  }

  setMapComponentsMaskToArchetype(
    index: number,
    bitMaskI: number,
    sortedBitMasks: number[],
    partialComponentsBitMask: number,
    componentsBitMask: number,
    componentsBitMaskToIndex: Record<number, number>
  ) {
    componentsBitMaskToIndex[bitMaskI] = index + this.partitionEntityArraysStartIndex;
    this.mapComponentMaskToArchetypeMask.set(bitMaskI, componentsBitMask);

    partialComponentsBitMask |= bitMaskI;
    this.mapComponentMaskToArchetypeMask.set(partialComponentsBitMask, componentsBitMask);
    for (let j = 0; j < sortedBitMasks.length; j++) {
      const bitMaskJ = sortedBitMasks[j];
      this.mapComponentMaskToArchetypeMask.set(bitMaskI | bitMaskJ, componentsBitMask);
    }

    return partialComponentsBitMask;
  }

  createArchetype({
    componentsBitMask,
    entityArray,
    sortedBitMasks,
  }: {
    componentsBitMask: number;
    entityArray: EntityArray;
    sortedBitMasks: number[];
  }) {
    const currentInsertIndex = this.partitionConstants.entityStartOffset;
    const entityLength = entityArray.length;

    const twoDimensionalArray = [
      new Array<Record<number, number> | ComponentData>(
        this.partitionConstants.entityStartOffset + entityLength
      ),
    ];
    const entityId = entityArray[0];
    this.mapEntityIdToMapComponentsMask.set(entityId, componentsBitMask);

    const componentsBitMaskToIndex: Record<number, number> = {};
    const entityIdToIndex = new Map([[entityId, currentInsertIndex]]);

    let partialComponentsBitMask = 0;
    for (let i = 0; i < sortedBitMasks.length; i++) {
      const bitMask = sortedBitMasks[i];
      partialComponentsBitMask = this.setMapComponentsMaskToArchetype(
        i,
        bitMask,
        sortedBitMasks,
        partialComponentsBitMask,
        componentsBitMask,
        componentsBitMaskToIndex
      );
    }

    //Set defaults
    twoDimensionalArray[0][1] = componentsBitMaskToIndex;
    twoDimensionalArray[0][2] = entityLength;

    //Set entity
    for (let i = 0; i < entityArray.length; i++) {
      twoDimensionalArray[0][currentInsertIndex + i] = entityArray[i];
    }

    //TODO - Fix this magic negative one
    twoDimensionalArray[0][0] = currentInsertIndex + entityLength - 1;

    /**
     * this.mapComponentsMaskToArchetype.set(componentsBitMask, {
     *   twoDimensionalArray: twoDimensionalArray as TwoDimensionalArray,
     *   entityIdToIndex,
     *   componentsBitMaskToPartitionIndex: new Map([[componentsBitMask, 0]]),
     * });
     *
     */

    const length = this.archetypes.push({
      twoDimensionalArray: twoDimensionalArray as TwoDimensionalArray,
      entityIdToIndex,
      componentsBitMaskToPartitionIndex: new Map([[componentsBitMask, 0]]),
    });

    //console.log('New archetype', this.archetypes[length - 1]);

    this.mapComponentsMaskToArchetypeIndex.set(componentsBitMask, length - 1);
  }

  reBalanceArchetype(componentsBitMask: number) {
    const archetypeNarrow = this.mapComponentsMaskToArchetype.get(componentsBitMask)!;

    for (const [componentsBitMaskWide, archetypeWide] of this.mapComponentsMaskToArchetype) {
      console.log(
        `Rebalance ${componentsBitMaskWide} & ${componentsBitMask}`,
        componentsBitMaskWide & componentsBitMask
      );

      const bitWise = componentsBitMaskWide & componentsBitMask;

      if (bitWise !== componentsBitMaskWide && bitWise !== 0) {
        //const index = archetypeWide.componentsBitMaskToPartitionIndex.get(componentsBitMask);
        for (const [maskNarrow, indexNarrow] of archetypeNarrow.componentsBitMaskToPartitionIndex) {
          archetypeWide.componentsBitMaskToPartitionIndex.set(
            maskNarrow,
            archetypeWide.twoDimensionalArray.length
          );
          archetypeWide.twoDimensionalArray.push(archetypeNarrow.twoDimensionalArray[indexNarrow]);
        }
      }
    }
  }

  getArchetypePartitionByStrictComponentsMask(
    componentsMask: readonly number[]
  ): ArchetypePartition | undefined {
    const maskForFind = componentsMask.reduce((acc, componentMask) => acc | componentMask, 0);

    const archetypeIndex = this.mapComponentsMaskToArchetypeIndex.get(maskForFind);
    const archetype = this.archetypes[archetypeIndex!];

    if (archetype === undefined) {
      console.error(`archetype not found for mask ${maskForFind}`);

      return;
    }

    const {twoDimensionalArray, componentsBitMaskToPartitionIndex} = archetype;

    const subArrayIndex = componentsBitMaskToPartitionIndex.get(maskForFind);

    if (subArrayIndex === undefined) {
      console.error(`subArrayIndex not found for mask ${maskForFind}`);

      return;
    }

    return twoDimensionalArray[subArrayIndex];
  }

  getArchetypePartitionByComponentsMasks(componentsMask: readonly number[]) {
    const maskForFind = componentsMask.reduce((acc, componentMask) => acc | componentMask, 0);
    const archetypesPartitions: TwoDimensionalArray = [];
    const processedMasks: number[] = [];
    for (const [mask, index] of this.mapComponentsMaskToArchetypeIndex) {
      if ((mask | maskForFind) === mask) {
        const archetype = this.archetypes[index];

        const {twoDimensionalArray, componentsBitMaskToPartitionIndex} = archetype;

        for (const [mask, index] of componentsBitMaskToPartitionIndex) {
          const or = mask | maskForFind;

          if (or === mask && !processedMasks.find(processedMask => processedMask === mask)) {
            archetypesPartitions.push(twoDimensionalArray[index]);
            processedMasks.push(mask);
          }
        }
      }
    }

    return archetypesPartitions;
  }

  getArchetypePartitionByComponentMask(componentMask: number) {
    const archetypesPartitions: TwoDimensionalArray = [];

    for (const [mask, index] of this.mapComponentsMaskToArchetypeIndex) {
      if ((mask | componentMask) === mask) {
        const {twoDimensionalArray, componentsBitMaskToPartitionIndex} = this.archetypes[index];
        for (const [mask, index] of componentsBitMaskToPartitionIndex) {
          if ((mask | componentMask) === mask) {
            archetypesPartitions.push(twoDimensionalArray[index]);
          }
        }
      }
    }

    return archetypesPartitions;
  }
}

export const WorldStorage = new SingletonWorldStorage();