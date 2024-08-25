import type {
  ComponentIds,
  ComponentsIndexesOffset,
  EntityArray,
  EntityInputs,
  TwoDimensionalArray,
} from '../types.ts';
import type {System} from '../systems/base.ts';
import {InvertedIndex} from '../helpers/search.ts';
import {ENTITY_OFFSETS} from '../entities';

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

  public insertEntities({entities, componentsId}: EntityInputs): {
    archetypeIndex: number;
    partitionIndex: number;
  } {
    const archetypeIndexes = this.archetypesPrefixTree.search(componentsId);
    const archetypeForInsertIndex = archetypeIndexes[this.archetypeConstants.fillIndex];

    if (archetypeIndexes.length === 0) {
      return this.createArchetype({
        entities,
        componentsId,
      });
    }

    const entityLength = entities[0].length;

    const archetype = this.archetypes[archetypeForInsertIndex];
    const partitionIndexes = archetype.componentsPartitionIndex.search(componentsId);

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
        componentsId,
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
      lastNotDeletedEntityOffset: entities.length * entityLength - entityLength,
      partition,
    });

    return {
      archetypeIndex: archetypeForInsertIndex,
      partitionIndex: partitionForInsertIndex,
    };
  }

  private createArchetype({entities, componentsId}: EntityInputs): {
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
      archetype: archetype,
      componentsId,
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
    componentsId,
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
      componentsId.reduce<ComponentsIndexesOffset>((acc, id, index) => {
        acc[id] = index + this.partitionConstants.entityStartOffset;

        return acc;
      }, {});
    partition[this.partitionConstants.entityLengthOffset] = entityLength;

    this.fillPartition({
      entities,
      lastNotDeletedEntityOffset:
        this.partitionConstants.entityStartOffset + entities.length * entityLength - entityLength,
      partition,
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
    archetype.componentsPartitionIndex.insert(componentsId, newPartitionIndex);
    this.archetypesPrefixTree.insert(componentsId, archetypeForInsertIndex);
  }

  private fillPartition({
    entities,
    partition,
    lastNotDeletedEntityOffset,
  }: {
    entities: EntityArray[];
    partition: Archetype['partitions'][number];
    lastNotDeletedEntityOffset: number;
  }) {
    for (let i = 0; i < entities.length; i++) {
      partition.push(...entities[i]);
    }

    partition[this.partitionConstants.lastNotDeletedEntityOffset] = partition[
      this.partitionConstants.lastNotDeletedEntityOffset
    ] += lastNotDeletedEntityOffset;
  }

  applyTickToEntitiesByComponentIds({
    componentIds,
    system,
    timeElapsed,
    now,
  }: {
    componentIds: ComponentIds;
    system: System;
    timeElapsed: number;
    now: number;
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

        for (
          let i = this.partitionConstants.entityStartOffset;
          i <= lastLiveEntityIndex;
          i += entityLength
        ) {
          console.log('entity tick');

          system.updateTick({
            index: i,
            idToComponentOffset,
            timeElapsed,
            partition,
            now,
          });
        }
      }
    }
  }
}
