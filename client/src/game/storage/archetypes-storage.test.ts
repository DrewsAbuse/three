import '../../../test/setup.main.mjs';
import {test} from 'node:test';
import assert from 'node:assert';
import {Mesh, Vector2, Vector3} from 'three';
import {createEntity} from '../entities/helpers/create.ts';
import {ArchetypeStorage} from './archetypes-storage.ts';

test('should insert same entities multiple times', () => {
  const storage = new ArchetypeStorage();
  const {archetypeIndex, partitionIndex} = storage.insertEntities(
    createEntity([
      {
        renderable: true,
        mouse: new Vector2(10, 10),
      },
      {
        renderable: true,
        mouse: new Vector2(20, 20),
      },
      {
        renderable: true,
        mouse: new Vector2(30, 30),
      },
    ])
  );

  assert.strictEqual(archetypeIndex, 0, 'Expected archetype index to be 0');
  assert.strictEqual(partitionIndex, 0, 'Expected partition index to be 0');
  assert.deepStrictEqual(
    storage.archetypes[archetypeIndex].partitions[partitionIndex],
    [
      13,
      {
        '2': 3,
        '5': 4,
      },
      5,
      0,
      0,
      0,
      new Vector2(10, 10),
      true,
      1,
      0,
      0,
      new Vector2(20, 20),
      true,
      2,
      0,
      0,
      new Vector2(30, 30),
      true,
    ],
    'Expected partition to match the specified structure'
  );
});

test('should insert entities multiple times', () => {
  const entity1 = createEntity([
    {
      renderable: true,
      mouse: new Vector2(10, 10),
    },
  ]);
  const entity2 = createEntity([
    {
      movement: [
        new Vector3(1, 1, 1),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
      ],
    },
  ]);
  const mesh = new Mesh();

  const entity3 = createEntity([
    {
      mesh,
    },
  ]);
  const entity4 = createEntity([
    {
      renderable: true,
      mouse: new Vector2(2, 20),
    },
  ]);
  const entity5 = createEntity([
    {
      mouse: new Vector2(2, 20),
    },
  ]);

  const storage = new ArchetypeStorage();
  const insert1 = storage.insertEntities(entity1);
  const insert2 = storage.insertEntities(entity2);
  const insert3 = storage.insertEntities(entity3);
  const insert4 = storage.insertEntities(entity4);
  const insert5 = storage.insertEntities(entity5);

  // Assertions for archetype and partition indices
  assert.strictEqual(insert1.archetypeIndex, 0);
  assert.strictEqual(insert1.partitionIndex, 0);

  assert.strictEqual(insert2.archetypeIndex, 1);
  assert.strictEqual(insert2.partitionIndex, 0);

  assert.strictEqual(insert3.archetypeIndex, 2);
  assert.strictEqual(insert3.partitionIndex, 0);

  assert.strictEqual(insert4.archetypeIndex, 0);
  assert.strictEqual(insert4.partitionIndex, 0);

  assert.strictEqual(insert5.archetypeIndex, 0);
  assert.strictEqual(insert5.partitionIndex, 1);

  assert.deepStrictEqual(
    storage.archetypes[insert1.archetypeIndex].partitions[insert1.partitionIndex],
    [
      3,
      {
        '2': 3,
        '5': 4,
      },
      5,
      3,
      0,
      0,
      new Vector2(10, 10),
      true,
      6,
      0,
      0,
      new Vector2(2, 20),
      true,
    ],
    'Expected partition to match the specified structure'
  );

  assert.deepStrictEqual(
    storage.archetypes[insert2.archetypeIndex].partitions[insert2.partitionIndex],
    [
      3,
      {
        '4': 3,
      },
      4,
      4,
      0,
      0,
      [
        new Vector3(1, 1, 1),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
      ],
    ],
    'Expected partition to match the specified structure for entity 2'
  );

  assert.deepStrictEqual(
    storage.archetypes[insert3.archetypeIndex].partitions[insert3.partitionIndex],
    [
      3,
      {
        '3': 3,
      },
      4,
      5,
      0,
      0,
      mesh,
    ],
    'Expected partition to match the specified structure for entity 3'
  );

  assert.deepStrictEqual(
    storage.archetypes[insert4.archetypeIndex].partitions[insert4.partitionIndex],
    storage.archetypes[insert1.archetypeIndex].partitions[insert1.partitionIndex],
    'Expected partition to match the specified structure for entity 4'
  );
  assert.deepStrictEqual(
    storage.archetypes[insert5.archetypeIndex].partitions[insert5.partitionIndex],
    [3, {'2': 3}, 4, 7, 0, 0, new Vector2(2, 20)],
    'Expected partition to match the specified structure for entity 5'
  );
});
