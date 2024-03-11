import type {Component, ComponentData} from '../components';
import {getAutoIncrementIdGenerator} from '../helpers';
import {MovementsSystemRunner} from '../systems/movments';

type IsEntityDeleted = 0 | 1;
type IsEntityDirty = 0 | 1;
type EntityComponentsBitMask = number;
export type EntityArray = [
  IsEntityDeleted,
  IsEntityDirty,
  EntityComponentsBitMask,
  ...ComponentData[],
];
type ComponentsIndexesOffset = Record<number, number>;
type LastInsertedIndex = number;
type EntityLength = number;
type TwoDimensionalArray = [
  LastInsertedIndex,
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
export const partitionConstants = {
  lastInsertedIndex: 0,
  componentsIndexesOffset: 1,
  entityLengthOffset: 2,
  entityStartOffset: 3,
} as const;

export abstract class World {
  //Entity
  entityAutoIncrementId = getAutoIncrementIdGenerator();
  mapComponentsMaskToArchetype: MapComponentsMaskToArchetype = new Map();
  mapComponentMaskToArchetypeMask: Map<number, number> = new Map();
  mapEntityIdTomapComponentsMask: Map<number, number> = new Map();

  //Helpers
  isDeletedInit = 0;
  isDirtyInit = 0;

  //Offsets
  partitionStartIndex = partitionConstants.entityStartOffset;
  partitionEntityArraysStartIndex = partitionConstants.entityStartOffset + 1;

  //Systems
  movementsSystemRunner: MovementsSystemRunner;

  protected constructor() {
    this.movementsSystemRunner = new MovementsSystemRunner();
  }

  createEntity(components: Component[]) {
    const componentsBitMask = components.reduce((acc, component) => acc | component.bitMask, 0);
    const sortedComponents = components.sort((a, b) => a.bitMask - b.bitMask);
    const entityId = this.entityAutoIncrementId();

    let isArchetypeFound = false;

    this.mapComponentsMaskToArchetype.forEach((archetype, archetypeKeyComponentsMask) => {
      if ((archetypeKeyComponentsMask & componentsBitMask) === archetypeKeyComponentsMask) {
        isArchetypeFound = true;

        const archetypePartitionIndex =
          archetype.componentsBitMaskToPartitionIndex.get(componentsBitMask);

        if (archetypePartitionIndex !== undefined) {
          const partition = archetype.twoDimensionalArray[archetypePartitionIndex];

          let lastInsertIndex = partition[0];

          this.mapEntityIdTomapComponentsMask.set(entityId, componentsBitMask);

          lastInsertIndex += 1;
          partition[lastInsertIndex] = entityId;
          archetype.entityIdToIndex.set(entityId, lastInsertIndex);

          lastInsertIndex += 1;
          partition[lastInsertIndex] = this.isDeletedInit;

          lastInsertIndex += 1;
          partition[lastInsertIndex] = this.isDirtyInit;
          //partition[++lastInsertIndex] = componentsBitMask;

          for (let i = 0; i < sortedComponents.length; i++) {
            const {data} = sortedComponents[i];
            lastInsertIndex += 1;
            partition[lastInsertIndex] = data;
          }

          partition[0] = lastInsertIndex;

          return;
        }

        let currentInsertIndex = this.partitionStartIndex;
        const entityLength = this.partitionStartIndex + sortedComponents.length;

        const partition = new Array<Record<number, number> | ComponentData>(
          this.partitionStartIndex + entityLength
        );
        this.mapEntityIdTomapComponentsMask.set(entityId, componentsBitMask);

        const componentsBitMaskToIndex: Record<number, number> = {};
        let partialComponentsBitMask = 0;

        currentInsertIndex += 1;
        partition[currentInsertIndex] = entityId;
        archetype.entityIdToIndex.set(entityId, currentInsertIndex);

        currentInsertIndex += 1;
        partition[currentInsertIndex] = this.isDeletedInit;

        currentInsertIndex += 1;
        partition[currentInsertIndex] = this.isDirtyInit;

        for (let i = 0; i < sortedComponents.length; i++) {
          const {bitMask, data} = sortedComponents[i];

          currentInsertIndex += 1;
          partition[currentInsertIndex] = data;
          partialComponentsBitMask = this.setMapComponentsMaskToArchetype(
            i,
            bitMask,
            sortedComponents,
            partialComponentsBitMask,
            componentsBitMask,
            componentsBitMaskToIndex
          );
        }

        partition[0] = currentInsertIndex;
        partition[1] = componentsBitMaskToIndex;
        partition[2] = entityLength;

        archetype.componentsBitMaskToPartitionIndex.set(
          componentsBitMask,
          archetype.twoDimensionalArray.push(partition as TwoDimensionalArray[number]) - 1
        );
      }
    });

    if (!isArchetypeFound) {
      this.createArchetype({
        componentsBitMask,
        components: sortedComponents,
      });
    }
  }

  createArchetype({
    componentsBitMask,
    components: sortedComponents,
  }: {
    components: Component[];
    componentsBitMask: number;
  }) {
    let currentInsertIndex = this.partitionStartIndex;
    const entityLength = this.partitionStartIndex + sortedComponents.length;

    const twoDimensionalArray = [
      new Array<Record<number, number> | ComponentData>(this.partitionStartIndex + entityLength),
    ];
    const entityId = this.entityAutoIncrementId();

    this.mapEntityIdTomapComponentsMask.set(entityId, componentsBitMask);

    const componentsBitMaskToIndex: Record<number, number> = {};

    twoDimensionalArray[0][currentInsertIndex] = entityId;
    const entityIdToIndex = new Map([[entityId, currentInsertIndex]]);

    currentInsertIndex += 1;
    twoDimensionalArray[0][currentInsertIndex] = this.isDeletedInit;

    currentInsertIndex += 1;
    twoDimensionalArray[0][currentInsertIndex] = this.isDirtyInit;

    let partialComponentsBitMask = 0;
    for (let i = 0; i < sortedComponents.length; i++) {
      const {bitMask, data} = sortedComponents[i];
      currentInsertIndex += 1;
      twoDimensionalArray[0][currentInsertIndex] = data;
      partialComponentsBitMask = this.setMapComponentsMaskToArchetype(
        i,
        bitMask,
        sortedComponents,
        partialComponentsBitMask,
        componentsBitMask,
        componentsBitMaskToIndex
      );
    }

    //Set defaults
    twoDimensionalArray[0][0] = currentInsertIndex;
    twoDimensionalArray[0][1] = componentsBitMaskToIndex;
    twoDimensionalArray[0][2] = entityLength;

    this.mapComponentsMaskToArchetype.set(componentsBitMask, {
      twoDimensionalArray: twoDimensionalArray as TwoDimensionalArray,
      entityIdToIndex,
      componentsBitMaskToPartitionIndex: new Map([[componentsBitMask, 0]]),
    });

    console.log('twoDimensionalArray', twoDimensionalArray);
  }

  setMapComponentsMaskToArchetype(
    index: number,
    bitMask: number,
    sortedComponents: Component[],
    partialComponentsBitMask: number,
    componentsBitMask: number,
    componentsBitMaskToIndex: Record<number, number>
  ) {
    componentsBitMaskToIndex[bitMask] = index + this.partitionEntityArraysStartIndex;
    this.mapComponentMaskToArchetypeMask.set(bitMask, componentsBitMask);

    partialComponentsBitMask |= bitMask;
    this.mapComponentMaskToArchetypeMask.set(partialComponentsBitMask, componentsBitMask);
    for (let j = 0; j < sortedComponents.length; j++) {
      const {bitMask: bitMaskTow} = sortedComponents[j];
      this.mapComponentMaskToArchetypeMask.set(bitMask | bitMaskTow, componentsBitMask);
    }

    return partialComponentsBitMask;
  }

  getArchetypePartitionByStrictComponentsMask(
    componentsMask: readonly number[]
  ): ArchetypePartition | undefined {
    const maskForFind = componentsMask.reduce((acc, componentMask) => acc | componentMask, 0);

    const query = this.mapComponentMaskToArchetypeMask.get(maskForFind)!;

    const archetype = this.mapComponentsMaskToArchetype.get(query);

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
    const query = this.mapComponentMaskToArchetypeMask.get(maskForFind)!;

    const archetype = this.mapComponentsMaskToArchetype.get(query);

    if (archetype === undefined) {
      return;
    }

    const {twoDimensionalArray, componentsBitMaskToPartitionIndex} = archetype;

    let subArrayIndex;

    for (const [mask, index] of componentsBitMaskToPartitionIndex) {
      if ((mask | maskForFind) === mask) {
        subArrayIndex = index;
        break;
      }
    }

    if (subArrayIndex === undefined) {
      return;
    }

    return twoDimensionalArray[subArrayIndex];
  }

  getArchetypePartitionByComponentMask(componentMask: number) {
    const archetypeMask = this.mapComponentMaskToArchetypeMask.get(componentMask);

    if (archetypeMask === undefined) {
      return;
    }

    const archetype = this.mapComponentsMaskToArchetype.get(archetypeMask);

    if (archetype === undefined) {
      return;
    }

    const {twoDimensionalArray, componentsBitMaskToPartitionIndex} = archetype;

    let subArrayIndex;

    for (const [mask, index] of componentsBitMaskToPartitionIndex) {
      if ((mask | componentMask) === mask) {
        subArrayIndex = index;
        break;
      }
    }

    if (subArrayIndex === undefined) {
      return;
    }

    return twoDimensionalArray[subArrayIndex];
  }

  abstract runSystems(timeElapsed: number): void;
}
