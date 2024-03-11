import {
  AxesHelper,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Component, bitMasks} from './components/component.ts';
import {keysInputComponent} from './components/singleton/input.ts';

const gltfLoader = new GLTFLoader();

const model = await gltfLoader.loadAsync('./assets/models/star_fox/scene.gltf').then(gltf => {
  gltf.scene.scale.set(12, 12, 12);
  gltf.scene.rotateY(Math.PI);

  return gltf.scene;
});

export const createPlayer = () => {
  const axesHelperMESH = new AxesHelper(50);
  axesHelperMESH.setColors(0xff0000, 0x00ff00, 0x0000ff);

  const mesh = new Mesh(
    new BoxGeometry(45, 15, 45),
    new MeshBasicMaterial({color: 0x00ff00, wireframe: true})
  );
  mesh.add(model);
  mesh.add(axesHelperMESH);

  const meshComponent = new Component({
    data: mesh,
    bitMask: bitMasks.mesh,
  });
  const movementComponent = new Component({
    data: [
      'air-craft',
      new Vector3(),
      new Vector3(0, 0, 2),
      new Vector3(0, 0, -3),
      new Vector3(),
      new Vector3(2, 1, 4),
      new Vector3(-30, -30, -20),
    ],
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
