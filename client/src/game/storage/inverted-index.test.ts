import {test} from 'node:test';
import assert from 'node:assert';
import {InvertedIndex} from './inverted-index.ts';

test('should test base search', () => {
  const some = new InvertedIndex();

  // Insertions
  some.insert(new Uint16Array([1, 2, 3, 4, 5, 6, 7, 8]), 1);
  some.insert(new Uint16Array([1, 2, 3, 4, 6, 7, 8, 9]), 2);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10]), 3);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10, 11]), 4);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10, 11, 12]), 5);
  some.insert(new Uint16Array([7, 8, 10, 11, 12, 55, 123, 132, 222, 333]), 6);

  // Searches
  const mask1 = new Uint16Array([1, 2, 3, 4]);
  const result1 = some.search(mask1);
  assert.deepStrictEqual(result1, [1, 2], 'Mask [1, 2, 3, 4] should match IDs [1, 2]');

  const mask2 = new Uint16Array([8, 10, 11]);
  const result2 = some.search(mask2);
  assert.deepStrictEqual(result2, [4, 5, 6], 'Mask [8, 10, 11] should match IDs [4, 5, 6]');

  const mask3 = new Uint16Array([55, 333]);
  const result3 = some.search(mask3);
  assert.deepStrictEqual(result3, [6], 'Mask [55, 333] should match ID [6]');

  const mask4 = new Uint16Array([7, 222]);
  const result4 = some.search(mask4);
  assert.deepStrictEqual(result4, [6], 'Mask [7, 222] should match ID [6]');

  const mask5 = new Uint16Array([222, 999]);
  const result5 = some.search(mask5);
  assert.deepStrictEqual(result5, [], 'Mask [222, 999] should return an empty array');
});

test('should test exclude search', () => {
  const some = new InvertedIndex();

  // Insertions
  some.insert(new Uint16Array([1, 2, 3, 4, 5, 6, 7, 8]), 1);
  some.insert(new Uint16Array([1, 2, 3, 4, 6, 7, 8, 9]), 2);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10]), 3);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10, 11]), 4);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10, 11, 12]), 5);
  some.insert(new Uint16Array([7, 8, 10, 11, 12, 55, 123, 132, 222, 333]), 6);

  // Searches
  const mask1 = new Uint16Array([1, 2, 3, 4]);
  const excludeMask1 = new Uint16Array([9]);
  const result1 = some.searchWithExclude(mask1, excludeMask1);
  assert.deepStrictEqual(result1, [1], 'Mask [1, 2, 3, 4] with exclude [9] should match ID [1]');

  const mask2 = new Uint16Array([8, 10, 11]);
  const excludeMask2 = new Uint16Array([12]);
  const result2 = some.searchWithExclude(mask2, excludeMask2);
  assert.deepStrictEqual(result2, [4], 'Mask [8, 10, 11] with exclude [12] should match ID [4]');
});
