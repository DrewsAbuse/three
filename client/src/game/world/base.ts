import {autoIncrementId} from '../helpers';
import {MovementsSystemRunner} from '../systems';
import {InvertedIndex} from '../helpers/search.ts';
import {ArchetypeStorage} from './storage.ts';

export abstract class World {
  //Entity
  entityAutoIncrementId = autoIncrementId;
  archetypesPrefixTree = new InvertedIndex();
  DEBUG = false;
  storage = new ArchetypeStorage();

  //Systems
  movementsSystemRunner = new MovementsSystemRunner();

  abstract runSystems(timeElapsed: number): void;
}
