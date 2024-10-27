import type {ArchetypeStorage} from './storage.ts';
import {MovementsWithKeysInputSystemRunner} from '../systems';

export abstract class World {
  DEBUG = false;
  storage: ArchetypeStorage;

  constructor(storage: ArchetypeStorage) {
    this.storage = storage;
  }
  //Systems
  movementsSystemRunner = new MovementsWithKeysInputSystemRunner();
  //cubeSnackSystem = new CubeSnackSystem();

  abstract runSystems(timeElapsed: number): void;
}
