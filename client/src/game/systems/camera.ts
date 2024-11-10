import {AxesHelper, ConeGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera} from 'three';
import type {TickParams} from '../types';
import {componentIdsEnum} from '../components';
import {cameraComponentDataIndexes} from '../components/camera.ts';
import {System} from './base.ts';

const FOV = 100;
const ASPECT = window.innerWidth / window.innerHeight;
const NEAR = 0.2;
const FAR = 3000;

const camera = new PerspectiveCamera(FOV, ASPECT, NEAR, FAR);

//Debug
const sphereGeometry = new ConeGeometry(5, 10, 25);
const sphereMaterial = new MeshBasicMaterial({color: 0xff0000});
const sphereMesh = new Mesh(sphereGeometry, sphereMaterial);
sphereMesh.rotation.x = Math.PI / 2;
const cameraAxisHelper = new AxesHelper(-10);

camera.add(cameraAxisHelper);
camera.add(sphereMesh);

export class CameraSystem extends System {
  camera = camera;

  constructor() {
    super({
      requiredComponents: new Uint16Array([componentIdsEnum.camera, componentIdsEnum.mesh]),
    });
  }

  updateTick({systemStep, partition}: TickParams) {
    const entityLength = partition.entityLength;
    for (let index = 0; index <= partition.currentFilledIndex; index += entityLength) {
      const mesh = partition.getPooledItem(index, componentIdsEnum.mesh);
      const cameraSettings = partition.getPooledItem(index, componentIdsEnum.camera);

      this.camera.position.lerp(
        cameraSettings[cameraComponentDataIndexes.idealOffset]
          .applyQuaternion(mesh.quaternion)
          .add(mesh.position),
        1.0 - 0.5 ** (systemStep * cameraSettings[cameraComponentDataIndexes.lerpCoefficient])
      );

      this.camera.quaternion.slerp(
        mesh.quaternion,
        1.0 - 0.5 ** (systemStep * cameraSettings[cameraComponentDataIndexes.slerpCoefficient])
      );

      cameraSettings[cameraComponentDataIndexes.idealOffset].set(
        cameraSettings[cameraComponentDataIndexes.position].x,
        cameraSettings[cameraComponentDataIndexes.position].y,
        cameraSettings[cameraComponentDataIndexes.position].z
      );
    }
  }
}
