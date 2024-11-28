import type {ArchetypeStorage} from '../storage';
import {MovementsWithKeysInputSystemRunner} from '../systems';
import {CollisionSystem} from '../systems/collision.ts';
import {GridOBBInHouse} from '../helpers/grid.ts';

export abstract class World {
  DEBUG = false;
  storage: ArchetypeStorage;
  grid = new GridOBBInHouse();

  constructor(storage: ArchetypeStorage) {
    this.storage = storage;
  }
  //Systems
  movementsSystemRunner = new MovementsWithKeysInputSystemRunner(this.grid);
  collisionSystem = new CollisionSystem(this.grid);
  //cubeSnackSystem = new CubeSnackSystem();

  abstract runSystems(timeElapsed: number): void;
}
