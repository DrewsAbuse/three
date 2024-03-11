import {Color, Vector3} from 'three';
import {
  composeInstancedMesh,
  createInstMeshWithRandPositionOffset,
  createInstancedMeshCloudCube,
  createInstancedMeshGeometry,
  createRandomRotationMatrix,
} from './inst-mesh.ts';
import {createSkybox} from './skybox.ts';
import {WebGPURenderer} from './web-gup.ts';

export {
  createInstancedMeshCloudCube,
  composeInstancedMesh,
  createInstancedMeshGeometry,
  createInstMeshWithRandPositionOffset,
  createRandomRotationMatrix,
  createSkybox,
  WebGPURenderer,
};

export const getAutoIncrementIdGenerator = () => {
  let id = 0;

  return () => ++id;
};
export const rainbowColors = [
  new Color(0xff0000),
  new Color(0xff7f00),
  new Color(0xffff00),
  new Color(0x00ff00),
  new Color(0x0000ff),
  new Color(0x4b0082),
  new Color(0x9400d3),
  new Color(0xff0000),
  new Color(0xff7f00),
  new Color(0xffff00),
  new Color(0x00ff00),
  new Color(0x0000ff),
  new Color(0x4b0082),
  new Color(0x9400d3),
  new Color(0xff0000),
  new Color(0xff7f00),
];

export const normalizedVec3 = {
  normalizedVector3X: new Vector3(1, 0, 0),
  normalizedVector3Y: new Vector3(0, 1, 0),
  normalizedVector3Z: new Vector3(0, 0, 1),
};
