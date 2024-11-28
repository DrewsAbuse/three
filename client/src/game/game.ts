import {BoxGeometry, Mesh, MeshBasicMaterial} from 'three';
import {createPlayerHUD, initGUI} from '../GUI/Components/index.ts';
import {forwardAcceleration, forwardDeceleration, player} from './entities/player.ts';
import {ClientWorld} from './world/index.ts';
import {ArchetypeStorage} from './storage/index.ts';
import {componentIdsEnum} from './components';

initGUI();
const storage = new ArchetypeStorage();
const world = new ClientWorld(storage);

world.createEntityAndAddToScene(player);

const mesh1 = new Mesh(
  new BoxGeometry(16, 16, 16),
  new MeshBasicMaterial({color: 0x00ffff, wireframe: true})
);

mesh1.position.set(-8, 8, 8);

const mesh2 = new Mesh(
  new BoxGeometry(16, 16, 16),
  new MeshBasicMaterial({color: 0x00ffff, wireframe: true})
);
mesh2.position.set(-8, 8, -8);

world.scene.add(mesh1);
world.scene.add(mesh2);

world.requestAnimationFrameFixedTimeStep();

setInterval(() => {
  console.debug('world.grid', world.grid);
}, 5000);

const geometry = new BoxGeometry(5, 5, 5);
geometry.translate(0, 2, 0);

const mesh = new Mesh(geometry, new MeshBasicMaterial({color: 0x00ff00}));

world.createEntityAndAddToScene({
  entityArray: [999, 0, 0, mesh],
  componentsId: new Uint16Array([componentIdsEnum.mesh]),
});
//
// document.getElementById('hud-right-bottom')!.innerHTML += createSpeedometer({
// speedSignal: forwardAcceleration,
// maxSpeed: 10,
// });
//

document.getElementById('hud-left-bottom')!.innerHTML += createPlayerHUD({
  forwardAcceleration,
  forwardDeceleration,
});
