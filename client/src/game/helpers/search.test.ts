import {InvertedIndex} from './search.ts';

it('should test base search', () => {
  const some = new InvertedIndex();

  // Insertions
  some.insert(new Uint16Array([1, 2, 3, 4, 5, 6, 7, 8]), 1);
  some.insert(new Uint16Array([1, 2, 3, 4, 6, 7, 8, 9]), 2);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10]), 3);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10, 11]), 4);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10, 11, 12]), 5);
  some.insert(new Uint16Array([7, 8, 10, 11, 12, 55, 123, 132, 222, 333]), 6);

  // Searches
  const mask = new Uint16Array([1, 2, 3, 4]);
  const result = some.search(mask);

  expect(result).toEqual([1, 2]);

  const mask2 = new Uint16Array([8, 10, 11]);
  const result2 = some.search(mask2);

  expect(result2).toEqual([4, 5, 6]);

  const mask3 = new Uint16Array([55, 333]);
  const result3 = some.search(mask3);

  expect(result3).toEqual([6]);

  const mask4 = new Uint16Array([7, 222]);
  const result4 = some.search(mask4);

  expect(result4).toEqual([6]);

  const mask5 = new Uint16Array([222, 999]);
  const result5 = some.search(mask5);

  expect(result5).toEqual([]);
});

it('should test exclude search', () => {
  const some = new InvertedIndex();

  // Insertions
  some.insert(new Uint16Array([1, 2, 3, 4, 5, 6, 7, 8]), 1);
  some.insert(new Uint16Array([1, 2, 3, 4, 6, 7, 8, 9]), 2);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10]), 3);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10, 11]), 4);
  some.insert(new Uint16Array([1, 2, 3, 5, 6, 7, 8, 10, 11, 12]), 5);
  some.insert(new Uint16Array([7, 8, 10, 11, 12, 55, 123, 132, 222, 333]), 6);

  // Searches
  const mask = new Uint16Array([1, 2, 3, 4]);
  const excludeMask = new Uint16Array([9]);
  const result = some.searchWithExclude(mask, excludeMask);

  expect(result).toEqual([1]);

  const mask2 = new Uint16Array([8, 10, 11]);
  const excludeMask2 = new Uint16Array([12]);
  const result2 = some.searchWithExclude(mask2, excludeMask2);

  expect(result2).toEqual([4]);
});
