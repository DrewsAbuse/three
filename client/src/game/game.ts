import {camera, renderer, scene} from './window.ts';
import {createPlayer} from './entities/player.ts';
import {ClientWorld} from './world';

const world = new ClientWorld({renderer, scene, camera});
world.requestAnimationFrameWithElapsedTime();
world.createEntityAndAddToScene(createPlayer());
