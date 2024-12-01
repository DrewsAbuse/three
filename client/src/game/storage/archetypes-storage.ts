import type {
  ComponentIds,
  ComponentsIndexesOffset,
  EntityArray,
  EntityInputs,
  TwoDimensionalArray,
} from '../types';
import type {System} from '../systems/base.ts';
import type {ComponentIdToData} from '../components';
import {ENTITY_OFFSETS} from '../entities/index.ts';
import {InvertedIndex} from './inverted-index.ts';

//New Solution without bitmask at all but with inverted index

type Archetype = {
  componentsPartitionIndex: InvertedIndex;
  entityIdToPartitionIndex: Map<number, number>;
  entityIdToIndex: Map<number, number>;
  partitions: TwoDimensionalArray;
};

export class ArchetypeStorage {
  private partitionConstants = {
    initPartitionIndex: 0,
    lastNotDeletedEntityOffset: 0,
    componentsIndexesOffset: 1,
    entityLengthOffset: 2,
    entityStartOffset: 3,
    fillIndex: 0,
  } as const;

  private entityIdToIndexes = new Map<
    number,
    {
      archetypeIndex: number;
      partitionIndex: number;
    }
  >();

  private entityConstants = ENTITY_OFFSETS;

  private archetypeConstants = {
    fillIndex: 0,
  };

  archetypes: Archetype[];
  private archetypesPrefixTree: InvertedIndex;

  constructor() {
    this.archetypes = [];
    this.archetypesPrefixTree = new InvertedIndex();
  }

  public invokeCallbackOnEntityComponent(
    id: number,
    callback: (entity: ComponentIdToData) => void
  ): void {
    const entityIndexes = this.entityIdToIndexes.get(id);

    if (entityIndexes === undefined) {
      console.error(`Entity with id ${id} not found. entityIndexes === undefined`);

      return;
    }

    const archetype = this.archetypes[entityIndexes.archetypeIndex];
    const partition = archetype.partitions[entityIndexes.partitionIndex];
    const entityIndex = archetype.entityIdToIndex.get(id);
    const idToComponentOffset = partition[this.partitionConstants.componentsIndexesOffset];

    if (entityIndex === undefined) {
      console.error(`Entity with id ${id} not found. entityIndex === undefined`);

      return;
    }

    const entityRecord: ComponentIdToData = {} as unknown as ComponentIdToData;

    const keys = Object.keys(idToComponentOffset);

    for (let i = 0; i < keys.length; i++) {
      const componentId = Number(keys[i]);
      const componentIndex = idToComponentOffset[componentId] + entityIndex;

      entityRecord[componentId] = partition[componentIndex] as ComponentIdToData[number];
    }

    callback(entityRecord);
  }

  public insertEntities({entities, componentIds}: EntityInputs): {
    archetypeIndex: number;
    partitionIndex: number;
  } {
    const archetypeIndexes = this.archetypesPrefixTree.search(componentIds);
    const archetypeForInsertIndex = archetypeIndexes[this.archetypeConstants.fillIndex];

    if (archetypeIndexes.length === 0) {
      return this.createArchetype({
        entities,
        componentIds,
      });
    }

    const entityLength = entities[0].length;

    const archetype = this.archetypes[archetypeForInsertIndex];
    const partitionIndexes = archetype.componentsPartitionIndex.search(componentIds);

    const partitionForInsertIndex = partitionIndexes.find(
      partitionIndex =>
        archetype.partitions[partitionIndex][this.partitionConstants.entityLengthOffset] ===
        entityLength
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
      });

      return {
        archetypeIndex: archetypeForInsertIndex,
        partitionIndex: newPartitionIndex,
      };
    }

    const partition = archetype.partitions[partitionForInsertIndex];

    this.fillPartition({
      entities,
      lastNotDeletedEntityOffset: entities.length * entityLength,
      partition,
      partitionForInsertIndex,
      archetypeForInsertIndex,
    });

    return {
      archetypeIndex: archetypeForInsertIndex,
      partitionIndex: partitionForInsertIndex,
    };
  }

  private createArchetype({entities, componentIds}: EntityInputs): {
    archetypeIndex: number;
    partitionIndex: number;
  } {
    const entityLength = entities[0].length;
    const partitions: TwoDimensionalArray = [];
    const entityIdToIndex = new Map();
    const entityIdToPartitionIndex = new Map();
    const componentsPartitionIndex = new InvertedIndex();

    const archetype: Archetype = {
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
  }: EntityInputs & {
    entityLength: number;
    archetype: Archetype;
    archetypeForInsertIndex: number;
    newPartitionIndex: number;
  }) {
    const partition = new Array(
      this.partitionConstants.entityStartOffset
    ) as Archetype['partitions'][number];
    partition[this.partitionConstants.lastNotDeletedEntityOffset] = 0;
    partition[this.partitionConstants.componentsIndexesOffset] =
      componentIds.reduce<ComponentsIndexesOffset>((acc, id, index) => {
        acc[id] = index + this.partitionConstants.entityStartOffset;

        return acc;
      }, {});
    partition[this.partitionConstants.entityLengthOffset] = entityLength;

    this.fillPartition({
      entities,
      lastNotDeletedEntityOffset:
        this.partitionConstants.entityStartOffset + entities.length * entityLength - entityLength,
      partition,
      archetypeForInsertIndex,
      partitionForInsertIndex: newPartitionIndex,
    });

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

  private fillPartition({
    entities,
    partition,
    lastNotDeletedEntityOffset,
    partitionForInsertIndex,
    archetypeForInsertIndex,
  }: {
    entities: EntityArray[];
    partition: Archetype['partitions'][number];
    lastNotDeletedEntityOffset: number;
    partitionForInsertIndex: number;
    archetypeForInsertIndex: number;
  }) {
    for (let i = 0; i < entities.length; i++) {
      partition.push(...entities[i]);
      this.entityIdToIndexes.set(entities[i][0], {
        archetypeIndex: archetypeForInsertIndex,
        partitionIndex: partitionForInsertIndex,
      });
    }

    partition[this.partitionConstants.lastNotDeletedEntityOffset] = partition[
      this.partitionConstants.lastNotDeletedEntityOffset
    ] += lastNotDeletedEntityOffset;
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

        const lastLiveEntityIndex = partition[this.partitionConstants.lastNotDeletedEntityOffset];
        const idToComponentOffset = partition[this.partitionConstants.componentsIndexesOffset];
        const entityLength = partition[this.partitionConstants.entityLengthOffset];

        system.updateTick({
          entityStartOffset: this.partitionConstants.entityStartOffset,
          lastLiveEntityIndex,
          entityLength,
          idToComponentOffset,
          systemStep,
          partition,
        });
      }
    }
  }
}
