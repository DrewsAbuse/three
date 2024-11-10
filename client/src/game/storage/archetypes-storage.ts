import type {ComponentIds, EntityInputsV2} from '../types';
import type {System} from '../systems/base.ts';
import {ENTITY_OFFSETS} from '../entities/index.ts';
import {KeysInput, componentIdsEnum, singletonComponentsPlaceholders} from '../components';
import {InvertedIndex} from './inverted-index.ts';
import {ENTITY_COMPONENTS_DATA_OFFSET} from './constants.ts';
import {PartitionBufferStoreBase} from './buffer.ts';

//New Solution without bitmask at all but with inverted index

type ArchetypeV2 = {
  componentsPartitionIndex: InvertedIndex;
  entityIdToPartitionIndex: Map<number, number>;
  entityIdToIndex: Map<number, number>;
  partitions: PartitionBufferStoreBase[];
};

export class ArchetypeStorageV2 {
  private partitionConstants = {
    initPartitionIndex: 0,
    lastNotDeletedEntityOffset: 0,
    componentsIndexesOffset: 1,
    entityLengthOffset: 2,
    entityStartOffset: ENTITY_COMPONENTS_DATA_OFFSET,
    fillIndex: 0,
  } as const;

  private entityConstants = ENTITY_OFFSETS;

  private archetypeConstants = {
    fillIndex: 0,
  };

  archetypes: ArchetypeV2[];

  private archetypesPrefixTree: InvertedIndex;

  constructor() {
    this.archetypes = [];
    this.archetypesPrefixTree = new InvertedIndex();
  }

  public insertEntities({entities, componentIds, shape}: EntityInputsV2): {
    archetypeIndex: number;
    partitionIndex: number;
  } {
    const archetypeIndexes = this.archetypesPrefixTree.search(componentIds);
    const archetypeForInsertIndex = archetypeIndexes[this.archetypeConstants.fillIndex];

    if (archetypeIndexes.length === 0) {
      return this.createArchetype({
        entities,
        componentIds,
        shape,
      });
    }

    const entityLength = entities[0].length;

    const archetype = this.archetypes[archetypeForInsertIndex];
    const partitionIndexes = archetype.componentsPartitionIndex.search(componentIds);

    const partitionForInsertIndex = partitionIndexes.find(
      partitionIndex => archetype.partitions[partitionIndex].entityLength === entityLength
    );

    if (partitionForInsertIndex === undefined) {
      const newPartitionIndex = archetype.partitions.length;
      this.createPartition({
        entities,
        entityLength,
        archetype,
        componentIds,
        newPartitionIndex,
        archetypeForInsertIndex,
        shape,
      });

      return {
        archetypeIndex: archetypeForInsertIndex,
        partitionIndex: newPartitionIndex,
      };
    }

    const partition = archetype.partitions[partitionForInsertIndex];

    partition.fillPartitionBatch(entities, entityLength);

    return {
      archetypeIndex: archetypeForInsertIndex,
      partitionIndex: partitionForInsertIndex,
    };
  }

  private createArchetype({entities, componentIds, shape}: EntityInputsV2): {
    archetypeIndex: number;
    partitionIndex: number;
  } {
    const entityLength = entities[0].length;
    const partitions: PartitionBufferStoreBase[] = [];
    const entityIdToIndex = new Map();
    const entityIdToPartitionIndex = new Map();
    const componentsPartitionIndex = new InvertedIndex();

    const archetype: ArchetypeV2 = {
      entityIdToIndex,
      entityIdToPartitionIndex,
      partitions,
      componentsPartitionIndex,
    };

    this.createPartition({
      entities,
      entityLength,
      archetype,
      componentIds,
      archetypeForInsertIndex: this.archetypes.length,
      newPartitionIndex: 0,
      shape,
    });

    this.archetypes.push(archetype);

    return {
      archetypeIndex: this.archetypes.length - 1,
      partitionIndex: 0,
    };
  }

  private createPartition({
    entities,
    entityLength,
    archetype,
    componentIds,
    archetypeForInsertIndex,
    newPartitionIndex,
    shape,
  }: EntityInputsV2 & {
    entityLength: number;
    archetype: ArchetypeV2;
    archetypeForInsertIndex: number;
    newPartitionIndex: number;
  }) {
    const partition = new PartitionBufferStoreBase({
      entityLength,
      idToComponentElementsDataShape: shape,
    });

    partition.fillPartitionBatch(entities, entityLength);

    entities.reduce((acc, entity) => {
      acc.set(
        entity[this.entityConstants.entityIdOffset],
        this.partitionConstants.initPartitionIndex
      );

      return acc;
    }, archetype.entityIdToPartitionIndex);
    entities.reduce(
      (acc, entity, index) =>
        acc.set(
          entity[0],
          index === 0
            ? this.partitionConstants.entityStartOffset
            : entityLength + this.partitionConstants.entityStartOffset + index - 1 //TODO: FIX this magic -1
        ),
      archetype.entityIdToIndex
    );

    archetype.partitions.push(partition);
    archetype.componentsPartitionIndex.insert(componentIds, newPartitionIndex);
    this.archetypesPrefixTree.insert(componentIds, archetypeForInsertIndex);
  }

  applyTickToEntitiesByComponentIds({
    componentIds,
    system,
    systemStep,
  }: {
    componentIds: ComponentIds;
    system: System;
    systemStep: number;
  }): void {
    const archetypeIndexes = this.archetypesPrefixTree.search(componentIds);

    for (const archetypeIndex of archetypeIndexes) {
      const archetype = this.archetypes[archetypeIndex];

      const partitionIndexes = archetype.componentsPartitionIndex.search(componentIds);

      if (partitionIndexes.length === 0) {
        console.error(`Archetype with components ${componentIds} not found.`);
        continue;
      }

      for (const partitionIndex of partitionIndexes) {
        const partition = archetype.partitions[partitionIndex];

        system.updateTick({
          systemStep,
          partition,
        });
      }
    }
  }
}
