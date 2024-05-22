import {AxesHelper, Mesh, Object3D, Quaternion, Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import dat from 'dat.gui';
import type {BitMaskToTypes, BitMasks} from '../components';
import type {EntityArray} from '../world';
import {Component, bitMasks, keysInputComponent} from '../components';
import {autoIncrementId} from '../helpers';

const gui = new dat.GUI();
const gltfLoader = new GLTFLoader();

export const model = await gltfLoader.loadAsync('models/star_fox/scene.gltf').then(gltf => {
  gltf.scene.scale.set(12, 12, 12);
  gltf.scene.rotateY(Math.PI);

  return gltf.scene;
});
export type PlayerEntityCreation = ReturnType<typeof createPlayer>;

export const createPlayer = (): {
  componentsBitMask: number;
  sortedBitMasks: number[];
  entityArray: EntityArray;
} => {
  const axisHelperMESH = new AxesHelper(50);
  axisHelperMESH.setColors(0xff0000, 0x00ff00, 0x0000ff);

  const mesh = new Mesh();
  mesh.add(model);

  mesh.add(axisHelperMESH);

  const meshComponent = new Component({
    data: mesh,
    bitMask: bitMasks.mesh,
  });

  const moveData: BitMaskToTypes[BitMasks['movement']] = [
    'air-craft',
    new Vector3(),
    new Vector3(0, 0, 2),
    new Vector3(0, 0, -3),
    new Vector3(),
    new Vector3(2, 1, 4),
    new Vector3(-4, -3, -12),
  ];

  //TODO: Add separate GUI SYSTEM
  const playerMoveFolder = gui.addFolder('Player Movement');
  const accelerationFolder = playerMoveFolder.addFolder('Acceleration');
  const decelerationFolder = playerMoveFolder.addFolder('Deceleration');

  accelerationFolder.add(moveData[2], 'z', 0, 20).name('forward');
  accelerationFolder.add(moveData[5], 'x', 0, 10).name('pitch');
  accelerationFolder.add(moveData[5], 'y', 0, 10).name('yaw');
  accelerationFolder.add(moveData[5], 'z', 0, 10).name('roll');

  decelerationFolder.add(moveData[3], 'z', -35, 0).name('forward');
  decelerationFolder.add(moveData[6], 'x', -20, 0).name('pitch');
  decelerationFolder.add(moveData[6], 'y', -15, 0).name('yaw');
  decelerationFolder.add(moveData[6], 'z', -40, 0).name('roll');

  const movementComponent = new Component({
    data: moveData,
    bitMask: bitMasks.movement,
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
    bitMask: bitMasks.camera,
  });

  const components = [keysComponent, meshComponent, movementComponent, cameraComponent];
  const sortedComponents = components.sort((a, b) => a.bitMask - b.bitMask);

  return {
    componentsBitMask: components.reduce(
      (
        acc: number,
        component: {
          bitMask: number;
        }
      ) => acc | component.bitMask,
      0
    ),
    sortedBitMasks: sortedComponents.map(component => component.bitMask),
    entityArray: [autoIncrementId(), 0, 0, ...sortedComponents.map(component => component.data)],
  };
};

export const createCubeEntity = (
  mesh: Mesh
): {
  componentsBitMask: number;
  sortedBitMasks: number[];
  entityArray: EntityArray;
} => {
  const meshComponent = new Component({
    data: mesh,
    bitMask: bitMasks.mesh,
  });
  const moveData: BitMaskToTypes[BitMasks['movement']] = [
    'cube',
    new Vector3(),
    new Vector3(0, 0, 2),
    new Vector3(0, 0, -3),
    new Vector3(),
    new Vector3(2, 1, 4),
    new Vector3(-4, -3, -12),
  ];
  const movementComponent = new Component({
    data: moveData,
    bitMask: bitMasks.movement,
  });

  const components = [meshComponent, movementComponent];
  const sortedComponents = components.sort((a, b) => a.bitMask - b.bitMask);

  return {
    componentsBitMask: components.reduce(
      (
        acc: number,
        component: {
          bitMask: number;
        }
      ) => acc | component.bitMask,
      0
    ),
    sortedBitMasks: sortedComponents.map(component => component.bitMask),
    entityArray: [autoIncrementId(), 0, 0, ...sortedComponents.map(component => component.data)],
  };
};
