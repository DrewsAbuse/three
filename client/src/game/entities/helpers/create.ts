import type {ComponentLabelToTypes} from '../../components';
import type {EntityInputs} from '../../types';
import {componentIdsEnum} from '../../components/index.ts';

import {autoIncrementId} from '../../helpers/utils.ts';

export const createEntity = <T extends ComponentLabelToTypes>(
  componentsWithData: Partial<T>[]
): EntityInputs => {
  const keys = Object.keys(componentsWithData[0]).sort() as (keyof ComponentLabelToTypes)[];

  return {
    componentIds: new Uint16Array(
      keys.map(
        key =>
          //@ts-expect-error - TS doesn't like the fact that we're using the enum as an array
          componentIdsEnum[key]
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
