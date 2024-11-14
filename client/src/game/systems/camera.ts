import {AxesHelper, ConeGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera} from 'three';
import type {TickParams} from '../types';
import type {ComponentIdToData} from '../components';
import {componentIdsEnum} from '../components';
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

  updateTick({
    systemStep,
    partition,
    entityLength,
    entityStartOffset,
    lastLiveEntityIndex,
    idToComponentOffset,
  }: TickParams) {
    const cameraIndex = idToComponentOffset[componentIdsEnum.camera];
    const meshIndex = idToComponentOffset[componentIdsEnum.mesh];

    for (let index = entityStartOffset; index <= lastLiveEntityIndex; index += entityLength) {
      const mesh = partition[index + meshIndex] as ComponentIdToData[componentIdsEnum.mesh];
      const cameraSettings = partition[
        index + cameraIndex
      ] as ComponentIdToData[componentIdsEnum.camera];

      this.camera.position.lerp(
        cameraSettings.idealOffset.applyQuaternion(mesh.quaternion).add(mesh.position),
        1.0 - 0.5 ** (systemStep * cameraSettings.lerpCoefficient)
      );

      this.camera.quaternion.slerp(
        mesh.quaternion,
        1.0 - 0.5 ** (systemStep * cameraSettings.slerpCoefficient)
      );

      cameraSettings.idealOffset.set(
        cameraSettings.position.x,
        cameraSettings.position.y,
        cameraSettings.position.z
      );
    }
  }
}
