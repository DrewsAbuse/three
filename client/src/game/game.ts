import {createPlayer} from './entities/player.ts';
import {ClientWorld} from './world';

const world = new ClientWorld();

world.requestAnimationFrameWithElapsedTime();
world.createEntityAndAddToScene(createPlayer());
