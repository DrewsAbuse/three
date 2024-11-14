class BitSet {
  private bits: Uint32Array;

  constructor(size: number) {
    this.bits = new Uint32Array(Math.ceil(size / 32));
  }

  set(index: number) {
    const wordIndex = index >> 5; // index / 32
    const bitIndex = index & 31; // index % 32
    this.bits[wordIndex] |= 1 << bitIndex;
  }

  get(index: number): boolean {
    const wordIndex = index >> 5;
    const bitIndex = index & 31;

    return !!(this.bits[wordIndex] & (1 << bitIndex));
  }

  and(other: BitSet): BitSet {
    const result = new BitSet(this.bits.length * 32);
    for (let i = 0; i < this.bits.length; i++) {
      result.bits[i] = this.bits[i] & other.bits[i];
    }

    return result;
  }

  andNot(other: BitSet): BitSet {
    const result = new BitSet(this.bits.length * 32);
    for (let i = 0; i < this.bits.length; i++) {
      result.bits[i] = this.bits[i] & ~other.bits[i];
    }

    return result;
  }

  isEmpty(): boolean {
    return this.bits.every(word => word === 0);
  }

  toArray(): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.bits.length * 32; i++) {
      if (this.get(i)) {
        result.push(i);
      }
    }

    return result;
  }
}

export class InvertedIndex {
  private index: Map<number, BitSet> = new Map();
  private maxId: number = 0;

  insert(array: Readonly<Uint16Array>, id: number): void {
    this.maxId = Math.max(this.maxId, id);
    for (const value of array) {
      if (!this.index.has(value)) {
        this.index.set(value, new BitSet(this.maxId + 1));
      }
      this.index.get(value)!.set(id);
    }
  }

  emptyContainer: number[] = [];

  search(includeComponents: Readonly<Uint16Array>): readonly number[] {
    let result: BitSet | null = null;

    for (const value of includeComponents) {
      const ids = this.index.get(value);

      if (!ids) {
        return [];
      }

      if (result === null) {
        result = ids;
      } else {
        result = result.and(ids);
        if (result.isEmpty()) {
          return this.emptyContainer;
        }
      }
    }

    return result ? result.toArray() : this.emptyContainer;
  }

  searchWithExclude(
    includeComponents: Readonly<Uint16Array>,
    excludeComponents: Readonly<Uint16Array>
  ): readonly number[] {
    let result: BitSet | null = null;

    for (const value of includeComponents) {
      const ids = this.index.get(value);

      if (!ids) {
        return [];
      }

      if (result === null) {
        result = ids;
      } else {
        result = result.and(ids);
        if (result.isEmpty()) {
          return this.emptyContainer;
        }
      }
    }

    for (const value of excludeComponents) {
      const ids = this.index.get(value);

      if (ids) {
        result = result!.andNot(ids);
        if (result.isEmpty()) {
          return this.emptyContainer;
        }
      }
    }

    return result ? result.toArray() : this.emptyContainer;
  }
}
