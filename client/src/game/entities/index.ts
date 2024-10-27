import type {ComponentIdToTypes, ComponentLabelToTypes} from '../components';
import type {EntityInput, EntityInputs} from '../types';
import {componentIds} from '../components';
import {autoIncrementId} from '../helpers';

export const ENTITY_OFFSETS = {
  entityIdOffset: 0,
  entityDeletedOffset: 1,
  entityDirtyOffset: 2,
  entityComponentsOffset: 3,
} as const;

export const createEntity = <T extends ComponentLabelToTypes>(
  componentsWithData: Partial<T>[]
): EntityInputs => {
  const keys = Object.keys(componentsWithData[0]).sort() as (keyof ComponentLabelToTypes)[];

  return {
    componentIds: new Uint16Array(
      keys.map(
        key =>
          //@ts-ignore
          componentIds[key]
      )
    ),
    entities: componentsWithData.map(componentData => [
      autoIncrementId(),
      0,
      0,
      ...keys.map(key => componentData[key]!),
    ]),
  };
};

export const invokeCallbacksOnEntityComponent = <T extends ComponentIdToTypes[number]>(
  entityInput: EntityInput,
  arr: {
    componentId: number;
    callback: (componentData: T) => void;
  }[]
) => {
  for (const {componentId, callback} of arr) {
    const movementComponentIndex =
      entityInput.componentsId.findIndex(id => id === componentId) +
      ENTITY_OFFSETS.entityComponentsOffset;

    for (let i = ENTITY_OFFSETS.entityComponentsOffset; i < entityInput.entityArray.length; i++) {
      if (i === movementComponentIndex) {
        callback(entityInput.entityArray[i] as T);
      }
    }
  }
};

export const invokeCallbackOnEntityComponent = <T extends ComponentIdToTypes[number]>(
  entityInput: EntityInput,
  {
    componentId,
    callback,
  }: {
    componentId: number;
    callback: (componentData: T) => void;
  }
) => {
  const movementComponentIndex =
    entityInput.componentsId.findIndex(id => id === componentId) +
    ENTITY_OFFSETS.entityComponentsOffset;

  for (let i = ENTITY_OFFSETS.entityComponentsOffset; i < entityInput.entityArray.length; i++) {
    if (i === movementComponentIndex) {
      callback(entityInput.entityArray[i] as T);
    }
  }
};
