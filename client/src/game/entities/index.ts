import type {ComponentLabelToTypes} from '../components';
import type {EntityInputs} from '../types.ts';
import {componentsId} from '../components';
import {getAutoIncrementIdGenerator} from '../helpers';

export const ENTITY_OFFSETS = {
  entityIdOffset: 0,
  entityDeletedOffset: 1,
  entityDirtyOffset: 2,
  entityComponentsOffset: 3,
} as const;

const generateEntityId = getAutoIncrementIdGenerator();

export const createEntity = <T extends ComponentLabelToTypes>(
  componentsWithData: Partial<T>[]
): EntityInputs => {
  const keys = Object.keys(componentsWithData[0]).sort() as (keyof ComponentLabelToTypes)[];

  return {
    componentsId: new Uint16Array(
      keys.map(
        key =>
          //@ts-ignore
          componentsId[key]
      )
    ),
    entities: componentsWithData.map(componentData => [
      generateEntityId(),
      0,
      0,
      ...keys.map(key => componentData[key]!),
    ]),
  };
};
