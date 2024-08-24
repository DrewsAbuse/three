import {Mesh, Vector2, Vector3} from 'three';
import {createEntity} from '../entities';
import {ArchetypeStorage} from './storage.ts';

it('should insert same entities multiple times', () => {
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

  expect(archetypeIndex).toEqual(0);
  expect(partitionIndex).toEqual(0);
  expect(storage.archetypes[archetypeIndex].partitions[partitionIndex]).toEqual([
    13,
    {
      '2': 3,
      '5': 4,
    },
    5,
    0,
    0,
    0,
    {
      x: 10,
      y: 10,
    },
    true,
    1,
    0,
    0,
    {
      x: 20,
      y: 20,
    },
    true,
    2,
    0,
    0,
    {
      x: 30,
      y: 30,
    },
    true,
  ]);
});

it('should insert entities multiple times', () => {
  const entity1 = createEntity([
    {
      renderable: true,
      mouse: new Vector2(10, 10),
    },
  ]);
  const entity2 = createEntity([
    {
      movement: [
        'air-craft',
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

  expect(insert1.archetypeIndex).toEqual(0);
  expect(insert1.partitionIndex).toEqual(0);

  expect(insert2.archetypeIndex).toEqual(1);
  expect(insert2.partitionIndex).toEqual(0);

  expect(insert3.archetypeIndex).toEqual(2);
  expect(insert3.partitionIndex).toEqual(0);

  expect(insert4.archetypeIndex).toEqual(0);
  expect(insert4.partitionIndex).toEqual(0);

  expect(insert5.archetypeIndex).toEqual(0);
  expect(insert5.partitionIndex).toEqual(1);

  expect(storage.archetypes[insert1.archetypeIndex].partitions[insert1.partitionIndex]).toEqual([
    3,
    {
      '2': 3,
      '5': 4,
    },
    5,
    3,
    0,
    0,
    {
      x: 10,
      y: 10,
    },
    true,
    6,
    0,
    0,
    {
      x: 2,
      y: 20,
    },
    true,
  ]);

  expect(storage.archetypes[insert2.archetypeIndex].partitions[insert2.partitionIndex]).toEqual([
    3,
    {
      '4': 3,
    },
    4,
    4,
    0,
    0,
    [
      'air-craft',
      {
        x: 1,
        y: 1,
        z: 1,
      },
      {
        x: 0,
        y: 0,
        z: 0,
      },
      {
        x: 0,
        y: 0,
        z: 0,
      },
      {
        x: 0,
        y: 0,
        z: 0,
      },
      {
        x: 0,
        y: 0,
        z: 0,
      },
      {
        x: 0,
        y: 0,
        z: 0,
      },
    ],
  ]);

  expect(storage.archetypes[insert3.archetypeIndex].partitions[insert3.partitionIndex]).toEqual([
    3,
    {
      '3': 3,
    },
    4,
    5,
    0,
    0,
    mesh,
  ]);

  expect(storage.archetypes[insert4.archetypeIndex].partitions[insert4.partitionIndex]).toEqual(
    storage.archetypes[insert1.archetypeIndex].partitions[insert1.partitionIndex]
  );
  expect(storage.archetypes[insert5.archetypeIndex].partitions[insert5.partitionIndex]).toEqual([
    3,
    {'2': 3},
    4,
    7,
    0,
    0,
    {x: 2, y: 20},
  ]);
});
