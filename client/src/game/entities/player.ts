import {AxesHelper, Mesh, Object3D, Quaternion, Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GUI} from 'dat.gui';
import type {BitMaskToTypes, BitMasks} from './components/component.ts';
import {Component, bitMasks} from './components/component.ts';
import {keysInputComponent} from './components/singleton/input.ts';

const gltfLoader = new GLTFLoader();

const model = await gltfLoader.loadAsync('models/star_fox/scene.gltf').then(gltf => {
  gltf.scene.scale.set(12, 12, 12);
  gltf.scene.rotateY(Math.PI);

  return gltf.scene;
});

const gui = new GUI();

export const createPlayer = () => {
  const axisHelperMESH = new AxesHelper(50);
  axisHelperMESH.setColors(0xff0000, 0x00ff00, 0x0000ff);

  const mesh = new Mesh();
  mesh.add(model);
  mesh.add(axisHelperMESH);

  gui.add(axisHelperMESH, 'visible').name('Axis Helper');

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

  accelerationFolder.add(moveData[2], 'z', 0, 10).name('forward');
  accelerationFolder.add(moveData[5], 'x', 0, 10).name('pitch');
  accelerationFolder.add(moveData[5], 'y', 0, 10).name('yaw');
  accelerationFolder.add(moveData[5], 'z', 0, 10).name('roll');

  decelerationFolder.add(moveData[3], 'x', -10, 0).name('forward');
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

  return [keysComponent, meshComponent, movementComponent, cameraComponent];
};
