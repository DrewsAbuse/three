import {BoxGeometry, MeshBasicMaterial} from 'three';
import {createPlayer} from './entities/player.ts';
import {createBox} from './entities/cube.ts';
import {ClientWorld} from './world';
import {createInstancedMeshCloudCube} from './helpers';
import {componentsId} from './components';

const world = new ClientWorld();

world.createEntityAndAddToScene(createPlayer());
world.createEntityAndAddToScene(createBox());
world.requestAnimationFrameFixedTimeStep();
const inst = createInstancedMeshCloudCube({
  attributes: {instanceCount: 1000},
  cloudScale: 800,
  particleGeometry: new BoxGeometry(3, 3, 3),
  particleMaterial: new MeshBasicMaterial({color: 0xffffff}),
});

world.createEntityAndAddToScene({
  entityArray: [999, 0, 0, inst],
  componentsId: new Uint16Array([componentsId.instancedMesh]),
});
