import '../../../test/setup.main.mjs';
import {test} from 'node:test';
import {Vector3} from 'three';
import {componentIdsEnum} from '../components/index.ts';
import {PartitionBufferStoreBase} from './buffer.ts';
const id1 = 1000;
const id2 = 1001;

const entity1 = new Float64Array([
  id1,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
]);
const entity2 = new Float64Array([
  id2,
  0,
  0,
  -1,
  -2,
  -3,
  -4,
  -5,
  -6,
  -7,
  -8,
  -9,
  -10,
  -11,
  -12,
  -13,
  -14,
  -15,
  -16,
  -17,
  -18,
]);

test('partitionBufferStoreBase', () => {
  const buffer = new PartitionBufferStoreBase({
    entityLength: entity1.length,
    idToComponentElementsDataShape: {
      [componentIdsEnum.movement]: [
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
      ],
      [componentIdsEnum.camera]: {
        constructorLikeOrObj: Vector3,
        keyAndTokenWithOffset: [
          {key: 'x', offset: 0},
          {key: 'y', offset: 1},
          {key: 'z', offset: 2},
        ],
      },
    },
  });

  buffer.fillPartition(entity1);
  buffer.fillPartition(entity2);

  /*
  using movement1 = buffer.getComponentDataView(componentIds.movement, 0);
  using movement2 = buffer.getComponentDataView(componentIds.movement, entity1.length);

  console.dir(movement1);
  console.dir(movement2);

   */

  const s = buffer.getPooledItem(0, componentIdsEnum.movement);

  console.dir(s);
  console.dir(buffer.pools[componentIdsEnum.movement]);

  s[0].x = -999999;

  s.backToPool();
  console.dir(buffer.pools[componentIdsEnum.movement]);
  console.dir(buffer.float64View);
});

test('partitionBufferStoreBase2', () => {
  const buffer = new PartitionBufferStoreBase({
    entityLength: entity1.length,
    idToComponentElementsDataShape: {
      [componentIdsEnum.movement]: [
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
        {
          constructorLikeOrObj: Vector3,
          keyAndTokenWithOffset: [
            {key: 'x', offset: 0},
            {key: 'y', offset: 1},
            {key: 'z', offset: 2},
          ],
        },
      ],
      [componentIdsEnum.camera]: {
        constructorLikeOrObj: Vector3,
        keyAndTokenWithOffset: [
          {key: 'x', offset: 0},
          {key: 'y', offset: 1},
          {key: 'z', offset: 2},
        ],
      },
    },
  });

  buffer.fillPartition(entity1);
  buffer.fillPartition(entity2);

  /*
  using movement1 = buffer.getComponentDataView(componentIds.movement, 0);
  using movement2 = buffer.getComponentDataView(componentIds.movement, entity1.length);

  console.dir(movement1);
  console.dir(movement2);

   */

  const s = buffer.getPooledItem(0, componentIdsEnum.movement);

  console.dir(s);
  console.dir(buffer.pools[componentIdsEnum.movement]);

  s[0].x = -999999;

  s.backToPool();
  console.dir(buffer.pools[componentIdsEnum.movement]);
  console.dir(buffer.float64View);
});
