import {BoxGeometry, MeshBasicMaterial} from 'three';
import {createPlayerHUD, initGUI} from '../GUI/Components';
import {createSpeedometer} from '../GUI/Components/Speedometer.ts';
import {forwardAcceleration, forwardDeceleration, player} from './entities/player.ts';
import {createBox} from './entities/cube.ts';
import {ClientWorld} from './world';
import {createInstancedMeshCloudCube} from './helpers';
import {componentIds} from './components';
import {ArchetypeStorage} from './world/storage.ts';

initGUI();

const storage = new ArchetypeStorage();
const world = new ClientWorld(storage);

world.createEntityAndAddToScene(player);
world.createEntityAndAddToScene(createBox());

const inst = createInstancedMeshCloudCube({
  attributes: {instanceCount: 10000},
  cloudScale: 800,
  particleGeometry: new BoxGeometry(8, 8, 8),
  particleMaterial: new MeshBasicMaterial({color: 0xffffff}),
});

world.createEntityAndAddToScene({
  entityArray: [999, 0, 0, inst],
  componentsId: new Uint16Array([componentIds.instancedMesh]),
});

world.requestAnimationFrameFixedTimeStep();

document.getElementById('hud-right-bottom')!.innerHTML += createSpeedometer({
  speedSignal: forwardAcceleration,
  maxSpeed: 10,
});

document.getElementById('hud-left-bottom')!.innerHTML += createPlayerHUD({
  forwardAcceleration,
  forwardDeceleration,
});
