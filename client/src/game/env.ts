import {getEntityData, storeEntityData} from './helpers/indexDB.ts';

const config = await import('../assets/config.json', {
  with: {type: 'json'},
});

export const {client, grid, entities} = config;

export const {FIXED_TIME_STEP, SYSTEM_STEP} = client;
export const {GRID_SIZE, GRID_DIVISIONS} = grid;

//TODO: FIX ANY
export const {
  player,
}: Record<string, Record<string, any>> = await (() =>
  entities.reduce(async (accPromise, entity) => {
    const acc = await accPromise;

    const data = await getEntityData(entity).catch(async () => {
      const {default: dataFromFile} = await import(`../assets/entities/${entity}.json`, {
        with: {type: 'json'},
      });

      await storeEntityData(entity, dataFromFile);

      return dataFromFile;
    });

    return {...acc, [entity]: data};
  }, Promise.resolve({})))();

export const {
  player: playerDefaults,
}: Record<string, Record<string, any>> = await (() =>
  entities.reduce(async (accPromise, entity) => {
    const acc = await accPromise;

    const {default: dataFromFile} = await import(`../assets/entities/${entity}.json`, {
      with: {type: 'json'},
    });

    return {...acc, [entity]: dataFromFile};
  }, Promise.resolve({})))();
