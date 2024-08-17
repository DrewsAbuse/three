import {autoIncrementId} from '../helpers';
import {MovementsSystemRunner} from '../systems';
import {InvertedIndex} from '../helpers/search.ts';
import {WorldStorage} from './storage.ts';

export abstract class World {
  //Entity
  entityAutoIncrementId = autoIncrementId;
  archetypesPrefixTree = new InvertedIndex();
  DEBUG = false;
  storage = WorldStorage;

  //Systems
  movementsSystemRunner: MovementsSystemRunner;

  protected constructor() {
    this.movementsSystemRunner = new MovementsSystemRunner();
  }

  abstract runSystems(timeElapsed: number): void;
}
