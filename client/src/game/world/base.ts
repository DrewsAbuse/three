import {MovementsWithKeysInputSystemRunner} from '../systems';
import {ArchetypeStorage} from './storage.ts';

export abstract class World {
  DEBUG = false;
  storage = new ArchetypeStorage();

  //Systems
  movementsSystemRunner = new MovementsWithKeysInputSystemRunner();
  //cubeSnackSystem = new CubeSnackSystem();

  abstract runSystems(timeElapsed: number): void;
}
