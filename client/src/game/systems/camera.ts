import type {Camera} from 'three';
import type {TickParams} from '../types.ts';
import type {ComponentIdToTypes} from '../components';
import {componentsId} from '../components';
import {System} from './base.ts';

export class CameraSystem extends System {
  private camera: Camera;

  constructor(cameraInstance: Camera) {
    super({
      requiredComponents: new Uint16Array([componentsId.camera, componentsId.mesh]),
    });
    this.camera = cameraInstance;
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
