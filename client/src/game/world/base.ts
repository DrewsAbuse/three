import type {ArchetypeStorage} from '../storage';
import {MovementsWithKeysInputSystemRunner} from '../systems';
import {SpatialHashGrid} from '../helpers';
import {CollisionSystem} from '../systems/collision.ts';

export abstract class World {
  DEBUG = false;
  storage: ArchetypeStorage;
  grid = new SpatialHashGrid();

  constructor(storage: ArchetypeStorage) {
    this.storage = storage;
  }
  //Systems
  movementsSystemRunner = new MovementsWithKeysInputSystemRunner(this.grid);
  collisionSystem = new CollisionSystem(this.grid);
  //cubeSnackSystem = new CubeSnackSystem();

  abstract runSystems(timeElapsed: number): void;
}
