import {BoxGeometry, Mesh, MeshBasicMaterial} from 'three';
import {createCubeEntity, createPlayer} from './entities/player.ts';
import {ClientWorld} from './world';

const world = new ClientWorld();

world.requestAnimationFrameWithElapsedTime();
world.createEntityAndAddToScene(createPlayer());

const box = new BoxGeometry();
const cube = new Mesh(box, new MeshBasicMaterial({color: 0x00ff00}));
world.createEntityAndAddToScene(createCubeEntity(cube));

console.dir(world);
