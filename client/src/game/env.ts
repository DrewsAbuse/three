import config from '../assets/config.json';
import {getEntityData, storeEntityData} from './helpers/indexDB.ts';

export const {client, grid, entities} = config;

export const {FIXED_TIME_STEP, SYSTEM_STEP} = client;
export const {GRID_SIZE, GRID_DIVISIONS} = grid;

export const {
  player,
}: Record<string, Record<string, unknown>> = await (() =>
  entities.reduce(async (accPromise, entity) => {
    const acc = await accPromise;

    const data = await getEntityData(entity).catch(async () => {
      const {default: dataFromFile} = await import(`../assets/entities/${entity}.json`);

      await storeEntityData(entity, dataFromFile);

      return dataFromFile;
    });

    return {...acc, [entity]: data};
  }, Promise.resolve({})))();

export const {
  player: playerDefaults,
}: Record<string, Record<string, unknown>> = await (() =>
  entities.reduce(async (accPromise, entity) => {
    const acc = await accPromise;

    const {default: dataFromFile} = await import(`../assets/entities/${entity}.json`);

    return {...acc, [entity]: dataFromFile};
  }, Promise.resolve({})))();
