import type {ComponentIdToData} from '../components';
import type {EntityInput} from '../types';

export const ENTITY_OFFSETS = {
  entityIdOffset: 0,
  entityDeletedOffset: 1,
  entityDirtyOffset: 2,
  entityComponentsOffset: 3,
} as const;

export const invokeCallbacksOnEntityComponent = <T extends ComponentIdToData[number]>(
  entityInput: EntityInput,
  arr: {
    componentId: number;
    callback: (componentData: T) => void;
  }[]
) => {
  for (const {componentId, callback} of arr) {
    const movementComponentIndex =
      entityInput.componentsId.indexOf(componentId) + ENTITY_OFFSETS.entityComponentsOffset;

    for (let i = ENTITY_OFFSETS.entityComponentsOffset; i < entityInput.entityArray.length; i++) {
      if (i === movementComponentIndex) {
        callback(entityInput.entityArray[i] as T);
      }
    }
  }
};

export const invokeCallbackOnEntityComponent = <T extends ComponentIdToData[number]>(
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
    entityInput.componentsId.indexOf(componentId) + ENTITY_OFFSETS.entityComponentsOffset;

  for (let i = ENTITY_OFFSETS.entityComponentsOffset; i < entityInput.entityArray.length; i++) {
    if (i === movementComponentIndex) {
      callback(entityInput.entityArray[i] as T);
    }
  }
};
