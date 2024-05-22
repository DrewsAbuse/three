export class InvertedIndex {
  private index: Map<number, number[]> = new Map();

  insert(array: Readonly<Uint32Array>, id: number): void {
    for (const value of array) {
      if (!this.index.has(value)) {
        this.index.set(value, []);
      }

      const ids = this.index.get(value);

      if (ids && !ids.includes(id)) {
        ids.push(id);
      }
    }
  }

  search(mask: Readonly<Uint32Array>): number[] {
    let result: number[] = [];
    for (const value of mask) {
      const ids = this.index.get(value);

      if (!ids) {
        return []; // Value not found, return empty result
      }

      if (result.length === 0) {
        result = ids.slice(); // Clone the array
      } else {
        result = result.filter(id => ids.includes(id));
      }
    }

    return result;
  }
}

const some = new InvertedIndex();

// Insertions
some.insert(new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8]), 1);
some.insert(new Uint32Array([1, 2, 3, 4, 6, 7, 8, 9]), 2);
some.insert(new Uint32Array([1, 2, 3, 5, 6, 7, 8, 10]), 3);
some.insert(new Uint32Array([1, 2, 3, 5, 6, 7, 8, 10, 11]), 4);
some.insert(new Uint32Array([1, 2, 3, 5, 6, 7, 8, 10, 11, 12]), 5);
some.insert(new Uint32Array([7, 8, 10, 11, 12, 55, 123, 132, 222, 333]), 6);

// Searches
const mask = new Uint32Array([1, 2, 3, 4]);
const result = some.search(mask);
console.log(result); // Output: [1, 2]

const mask2 = new Uint32Array([8, 10, 11]);
const result2 = some.search(mask2);
console.log(result2); // Output: [4]

const mask3 = new Uint32Array([55, 333]);
const result3 = some.search(mask3);
console.log(result3); // Output: [6]

const mask4 = new Uint32Array([7, 222]);
const result4 = some.search(mask4);
console.log(result4); // Output: [6]
