import {AxesHelper, Mesh, Object3D, Quaternion, Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import dat from 'dat.gui';
import type {EntityInput} from '../types.ts';
import type {ComponentIdToTypes} from '../components';
import {movementComponentDataIndexes} from '../components';
import {componentsId} from '../components';
import {Component, keysInputComponent} from '../components';
import {autoIncrementId} from '../helpers';

//TODO: Move GUI form player
//TODO: Reduce array and objects creation while creating entities

const gui = new dat.GUI();
const gltfLoader = new GLTFLoader();

export const model = await gltfLoader.loadAsync('models/star_fox/scene.gltf').then(gltf => {
  gltf.scene.scale.set(12, 12, 12);
  gltf.scene.rotateY(Math.PI);

  return gltf.scene;
});
export type PlayerEntityCreation = ReturnType<typeof createPlayer>;

export const createPlayer = (): EntityInput => {
  const axisHelperMESH = new AxesHelper(50);
  axisHelperMESH.setColors(0xff0000, 0x00ff00, 0x0000ff);

  const mesh = new Mesh();
  mesh.add(model);

  mesh.add(axisHelperMESH);

  const meshComponent = new Component({
    data: mesh,
    id: componentsId.mesh,
  });

  const moveData: ComponentIdToTypes[componentsId.movement] = [
    new Vector3(),
    new Vector3(0, 0, 16),
    new Vector3(0, 0, -3),
    new Vector3(),
    new Vector3(2, 1, 4),
    new Vector3(-4, -3, -12),
  ];

  //TODO: Add separate GUI SYSTEM
  const playerMoveFolder = gui.addFolder('Player Movement');
  const accelerationFolder = playerMoveFolder.addFolder('Acceleration');
  const decelerationFolder = playerMoveFolder.addFolder('Deceleration');

  accelerationFolder
    .add(moveData[movementComponentDataIndexes.accelerationMove], 'z', 0, 20)
    .name('forward');
  accelerationFolder
    .add(moveData[movementComponentDataIndexes.accelerationRotation], 'x', 0, 10)
    .name('pitch');
  accelerationFolder
    .add(moveData[movementComponentDataIndexes.accelerationRotation], 'y', 0, 10)
    .name('yaw');
  accelerationFolder
    .add(moveData[movementComponentDataIndexes.accelerationRotation], 'z', 0, 10)
    .name('roll');

  decelerationFolder
    .add(moveData[movementComponentDataIndexes.decelerationMove], 'z', -35, 0)
    .name('forward');
  decelerationFolder
    .add(moveData[movementComponentDataIndexes.decelerationRotation], 'x', -20, 0)
    .name('pitch');
  decelerationFolder
    .add(moveData[movementComponentDataIndexes.decelerationRotation], 'y', -15, 0)
    .name('yaw');
  decelerationFolder
    .add(moveData[movementComponentDataIndexes.decelerationRotation], 'z', -40, 0)
    .name('roll');

  const movementComponent = new Component({
    data: moveData,
    id: componentsId.movement,
  });
  const keysComponent = keysInputComponent;

  const cameraComponent = new Component({
    data: {
      position: new Vector3(0, 25, 80),
      quaternion: new Quaternion(0, 0, 0, 0),
      idealOffset: new Vector3(0, 25, 80),
      lookAt: new Object3D(),
      lerpCoefficient: 10,
      slerpCoefficient: 5,
    },
    id: componentsId.camera,
  });

  const components = [keysComponent, meshComponent, movementComponent, cameraComponent];
  const sortedComponents = components.sort((a, b) => a.id - b.id);

  return {
    componentsId: new Uint16Array(sortedComponents.map(({id}) => id)),
    entityArray: [autoIncrementId(), 0, 0, ...sortedComponents.map(component => component.data)],
  };
};
