import {
  ComponentIdToData,
  type ComponentKeys,
  ComponentsData,
  SingletonComponentIdToValue,
  componentIdsEnum,
  singletonComponentsValues,
} from '../components/index.ts';
import {createMixinWithFunc} from '../helpers/index.ts';
import {ENTITY_COMPONENTS_DATA_OFFSET} from './constants.ts';

class PascalStringView {
  buffer: Uint8Array;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer; // Reference to the Buffer instance
  }

  /**
   * Encodes a string and writes it as a Pascal-style string into the buffer.
   * @param str The string to write.
   * @param offset The offset in the buffer to start writing.
   * @returns The new offset after writing the string.
   */

  public writePascalString(str: string, offset: number): number {
    const encoded: Uint8Array = new TextEncoder().encode(str); // Encode the string
    const length: number = encoded.length; // Get the length of the encoded string

    // Write the length of the string as the first byte
    this.buffer[offset] = length;

    // Write the string data after the length
    this.buffer.set(encoded, offset + 1);

    // Return the new offset
    return offset + 1 + length; // Move to the next position
  }

  /**
   * Reads a Pascal-style string from the buffer.
   * @param offset The offset in the buffer to start reading.
   * @returns An object containing the string and the new offset.
   */

  public readPascalString(offset: number): {str: string; newOffset: number} {
    const length: number = this.buffer[offset]; // Read the length of the string
    const strData = this.buffer.subarray(offset + 1, offset + 1 + length); // Extract string bytes
    const str: string = new TextDecoder().decode(strData); // Decode bytes to string

    // Return the string and the new offset
    return {str, newOffset: offset + 1 + length};
  }
}

/**
 * @description {Float64Array} `Entity`
 * [...orderedComponentData]
 */
type EntityComponentsFloat64Array = Float64Array;

//type ComponentElementOffset = `${number}`;

//type TokenWithComponentElementOffset = `${TokenUnion} ${ComponentElementOffset}`;

/**
 * @description {Float64Array} `ComponentIdAndOffsetArray`
 *  [
 *    ...[componentId, componentOffset,
 *      ...[TokenWithComponentElementOffset]]
 *  ]
 */
//type ComponentToBufferMapperArray = ArrayBufferLike;

type ConstructorEmptyParams = new () => any;

type CallableOrConstructable =
  | (() => any) // Function type that returns T
  | ConstructorEmptyParams;

type ConstructorLikeOrObj = CallableOrConstructable;

type KeyOfReturnTypeOrInstanceOf<T extends ConstructorLikeOrObj> = T extends new () => any
  ? keyof InstanceType<T>
  : T extends () => any
    ? keyof ReturnType<T>
    : T extends ComponentsData
      ? keyof T
      : never;

type DataShape<T extends ConstructorLikeOrObj> = {
  constructorLikeOrObj: T;
  keyAndTokenWithOffset: {
    key: KeyOfReturnTypeOrInstanceOf<T>;
    offset: number;
  }[];
};

type ComponentDataShape<T extends CallableOrConstructable> = DataShape<T> | DataShape<T>[];

export type ComponentIdToMeta<T extends CallableOrConstructable = CallableOrConstructable> = {
  [key: string]: ComponentDataShape<T>;
};

const instantiate = (instantiatable: any) => {
  if (typeof instantiatable !== 'function') {
    throw new Error('Not a constructor');
  }

  // Check if the arrow function has a prototype
  if (!instantiatable.prototype.properties) {
    return instantiatable();
  }

  return new instantiatable();
};

type SingletonComponentsStorageIndex = {
  [componentIdsEnum.keysInput]: 0;
};
type SingletonComponentsStorageKeys = keyof SingletonComponentsStorageIndex;

export class PartitionBufferStoreBase<T extends CallableOrConstructable = CallableOrConstructable> {
  private buffer: ArrayBufferLike;
  float64View: Float64Array;
  currentFilledIndex: number = 0;
  idToComponentElementsDataShape: ComponentIdToMeta<T>;
  entityLength: number;
  stringView: PascalStringView;

  singletonComponentsStorage = singletonComponentsValues;
  singletonComponentsStorageIndex: SingletonComponentsStorageIndex = {
    [componentIdsEnum.keysInput]: 0,
  };

  constructor({
    entityLength,
    idToComponentElementsDataShape,
  }: {
    entityLength: number;
    idToComponentElementsDataShape: ComponentIdToMeta<T>;
  }) {
    this.entityLength = entityLength;

    this.buffer = new ArrayBuffer(entityLength * 1024);
    this.float64View = new Float64Array(this.buffer);

    this.idToComponentElementsDataShape = idToComponentElementsDataShape;

    this.stringView = new PascalStringView(new Uint8Array(this.buffer));
  }

  pools: Record<number, any[]> = {};

  getSingletonItem<ComponentId extends SingletonComponentsStorageKeys>(
    componentId: ComponentId
  ): SingletonComponentIdToValue[ComponentId] {
    return this.singletonComponentsStorage[
      this.singletonComponentsStorageIndex[componentId as SingletonComponentsStorageKeys]
    ] as SingletonComponentIdToValue[ComponentId];
  }

  getPooledItem<ComponentId extends ComponentKeys>(
    entityIndex: number,
    componentId: ComponentId
  ): ComponentIdToData[ComponentId] & {backToPool: () => void} {
    let pool = this.pools[componentId];

    if (!pool) {
      pool = this.pools[componentId] = [];
    }

    if (pool.length === 0) {
      const dataShape = this.idToComponentElementsDataShape[`${componentId}`];

      const float64View = this.float64View;

      if (Array.isArray(dataShape)) {
        const arr: any = [];

        for (let i = 0; i < dataShape.length; i++) {
          const element = dataShape[i];

          const inst = instantiate(element.constructorLikeOrObj);

          for (let j = 0; j < element.keyAndTokenWithOffset.length; j++) {
            const {key, offset} = element.keyAndTokenWithOffset[j];

            inst[key] =
              this.float64View[
                offset +
                  ENTITY_COMPONENTS_DATA_OFFSET +
                  i * element.keyAndTokenWithOffset.length +
                  entityIndex
              ];
          }
          arr.push(inst);
        }

        return createMixinWithFunc({
          some: arr,
          key: 'backToPool' as const,
          func() {
            for (let i = 0; i < arr.length; i++) {
              const element = dataShape[i];
              const value = arr[i];
              for (let j = 0; j < element.keyAndTokenWithOffset.length; j++) {
                const {key, offset} = element.keyAndTokenWithOffset[j];

                float64View[
                  offset +
                    ENTITY_COMPONENTS_DATA_OFFSET +
                    i * element.keyAndTokenWithOffset.length +
                    entityIndex
                ] = value[key];
              }
            }

            pool.push(arr);
          },
        });
      }

      const inst = instantiate(dataShape.constructorLikeOrObj);

      for (let j = 0; j < dataShape.keyAndTokenWithOffset.length; j++) {
        const {key, offset} = dataShape.keyAndTokenWithOffset[j];

        inst[key] =
          this.float64View[
            offset +
              ENTITY_COMPONENTS_DATA_OFFSET +
              dataShape.keyAndTokenWithOffset.length +
              entityIndex
          ];
      }

      return createMixinWithFunc({
        some: inst,
        key: 'backToPool' as const,
        func() {
          //Set Back Values
          for (let i = 0; i < inst.length; i++) {
            const element = inst[i];
            for (let j = 0; j < dataShape.keyAndTokenWithOffset.length; j++) {
              const {key, offset} = dataShape.keyAndTokenWithOffset[j];

              float64View[
                offset +
                  ENTITY_COMPONENTS_DATA_OFFSET +
                  i * dataShape.keyAndTokenWithOffset.length +
                  entityIndex
              ] = element[key];
            }
          }

          pool.push(inst);
        },
      });
    }

    return pool.pop();
  }

  fillPartition(entityComponents: EntityComponentsFloat64Array) {
    this.float64View.set(entityComponents, this.currentFilledIndex);

    this.currentFilledIndex += entityComponents.length;
  }

  fillPartitionBatch(entityComponents: EntityComponentsFloat64Array[], entityLength: number) {
    for (let i = 0; i < entityComponents.length; i++) {
      this.fillPartition(entityComponents[i]);
    }

    this.currentFilledIndex += entityComponents.length * entityLength;
  }
}
