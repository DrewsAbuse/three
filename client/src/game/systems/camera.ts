import {AxesHelper, ConeGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera} from 'three';
import type {TickParams} from '../types.ts';
import type {ComponentIdToTypes} from '../components';
import {componentsId} from '../components';
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
      requiredComponents: new Uint16Array([componentsId.camera, componentsId.mesh]),
    });
  }

  updateTick({timeElapsed, partition, index, idToComponentOffset}: TickParams) {
    const cameraIndex = idToComponentOffset[componentsId.camera];
    const meshIndex = idToComponentOffset[componentsId.mesh];

    const mesh = partition[index + meshIndex] as ComponentIdToTypes[componentsId.mesh];
    const cameraSettings = partition[
      index + cameraIndex
    ] as ComponentIdToTypes[componentsId.camera];

    this.camera.position.lerp(
      cameraSettings.idealOffset.applyQuaternion(mesh.quaternion).add(mesh.position),
      1.0 - Math.pow(0.5, timeElapsed * cameraSettings.lerpCoefficient)
    );

    this.camera.quaternion.slerp(
      mesh.quaternion,
      1.0 - Math.pow(0.5, timeElapsed * cameraSettings.slerpCoefficient)
    );

    cameraSettings.idealOffset.set(
      cameraSettings.position.x,
      cameraSettings.position.y,
      cameraSettings.position.z
    );
  }
}
