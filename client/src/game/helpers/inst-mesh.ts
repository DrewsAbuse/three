import {
  BoxGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from 'three';
import type {BufferGeometry, Material, TypedArray} from 'three';
import {rainbowColors} from './index.ts';

type ComposeInstancedMeshParams = {
  attributes: {
    positionArray: TypedArray;
    instanceCount: number;
  };
  meshGeometry?: BufferGeometry;
  material?: Material;
  addRandomnessToPosition?: boolean;
  setRainbowColors?: boolean;
};

export const composeInstancedMesh = (params: ComposeInstancedMeshParams) => {
  const {
    attributes: {instanceCount},
    meshGeometry = new BoxGeometry(0.3, 0.3, 0.3),
    material = new MeshBasicMaterial({wireframe: true}),
  } = params;

  console.log('instanceCount', instanceCount);

  const instancedMesh = new InstancedMesh(meshGeometry, material, instanceCount);
  instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);

  const matrix = new Matrix4();
  const offset = new Vector3();
  const orientation = new Quaternion();
  const scale = new Vector3(1, 1, 1);
  let x, y, z, w;

  for (let i = 0; i < instanceCount; i++) {
    // offsets

    x = Math.random() * 10;
    y = Math.random() * 10;
    z = Math.random() * 10;

    offset.set(x, y, z).normalize();
    offset.multiplyScalar(1); // move out at least 5 units from center in current direction
    offset.set(x + offset.x, y + offset.y, z + offset.z);

    // orientations

    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    z = Math.random() * 2 - 1;
    w = Math.random() * 2 - 1;

    orientation.set(x, y, z, w).normalize();

    matrix.compose(offset, orientation, scale);

    instancedMesh.setMatrixAt(i, matrix);
    instancedMesh.setColorAt(i, rainbowColors[i % rainbowColors.length]);

    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  return instancedMesh;
};

export const createRandomRotationMatrix = () => {
  const rand = Math.random();

  return new Matrix4(
    1,
    0,
    0,
    0,
    0,
    Math.cos(rand),
    -Math.sin(rand),
    0,
    0,
    Math.sin(rand),
    Math.cos(rand),
    0,
    0,
    0,
    0,
    1
  );
};

export const createInstancedMeshCloudCube = (params: {
  attributes: {instanceCount: number};
  particleGeometry?: BoxGeometry;
  particleMaterial?: Material;
  cloudScale?: number;
}) => {
  const {
    particleGeometry = new BoxGeometry(0.3, 0.3, 0.3),
    particleMaterial = new MeshBasicMaterial(),
    attributes: {instanceCount},
    cloudScale = 1,
  } = params;

  const instancedMesh = new InstancedMesh(particleGeometry, particleMaterial, instanceCount);

  instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);

  const matrix = new Matrix4();
  const offset = new Vector3();
  const orientation = new Quaternion();
  const scale = new Vector3(1, 1, 1);

  for (let i = 0; i < instanceCount; i++) {
    // offsets

    offset
      .random()
      .subScalar(0.5)
      .multiplyScalar(10 * cloudScale);

    orientation.random();

    matrix.compose(offset, orientation, scale);

    instancedMesh.setMatrixAt(i, matrix);
    instancedMesh.setColorAt(i, rainbowColors[i % rainbowColors.length]);

    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  return instancedMesh;
};

type ComposeInstancedMeshGeometryParams = {
  sourceGeometry: BufferGeometry;
  particleGeometry?: BufferGeometry;
  particleMaterial?: Material;
  addRandomnessToPosition?: boolean;
  setRainbowColors?: boolean;
};

export const createInstancedMeshGeometry = (params: ComposeInstancedMeshGeometryParams) => {
  const {
    sourceGeometry,
    particleMaterial = new MeshBasicMaterial({wireframe: true}),
    particleGeometry = new BoxGeometry(0.3, 0.3, 0.3),
  } = params;

  const particleCount = sourceGeometry.attributes.position.count;
  const particlePositions = sourceGeometry.attributes.position.array;

  const instancedMesh = new InstancedMesh(particleGeometry, particleMaterial, particleCount);
  instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);

  const matrix = new Matrix4();
  const offset = new Vector3();
  const orientation = new Quaternion();
  const scale = new Vector3(1, 1, 1);
  let x, y, z, w;

  for (let i = 0; i < particleCount; i++) {
    // offsets

    x = particlePositions[i * 3];
    y = particlePositions[i * 3 + 1];
    z = particlePositions[i * 3 + 2];

    offset.set(x, y, z).normalize();
    offset.multiplyScalar(1); // move out at least 5 units from center in current direction
    offset.set(x + offset.x, y + offset.y, z + offset.z);

    // orientations

    x = Math.random() * 20 - 1;
    y = Math.random() * 20 - 1;
    z = Math.random() * 20 - 1;
    w = Math.random() * 20 - 1;

    orientation.set(x, y, z, w).normalize();

    matrix.compose(offset, orientation, scale);

    instancedMesh.setMatrixAt(i, matrix);
    instancedMesh.setColorAt(i, rainbowColors[Math.floor(Math.random() * rainbowColors.length)]);

    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  return instancedMesh;
};

export const createInstMeshWithRandPositionOffset = (
  params: ComposeInstancedMeshGeometryParams
) => {
  const {
    sourceGeometry,
    particleMaterial = new MeshBasicMaterial({wireframe: true}),
    particleGeometry = new BoxGeometry(0.1, 0.1, 0.1),
  } = params;

  const particleCount = sourceGeometry.attributes.position.count;
  const particlePositions = sourceGeometry.attributes.position.array;

  const instancedMesh = new InstancedMesh(particleGeometry, particleMaterial, particleCount);
  instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);

  const matrix = new Matrix4();
  const offset = new Vector3();
  const orientation = new Quaternion();
  const scale = new Vector3(1, 1, 1);
  let x, y, z, w;

  for (let i = 0; i < particleCount; i++) {
    // offsets

    x = particlePositions[i * 3] + Math.random();
    y = particlePositions[i * 3 + 1] + Math.random();
    z = particlePositions[i * 3 + 2] + Math.random();

    offset.set(x, y, z).normalize();
    offset.multiplyScalar(0.5); // move out at least 5 units from center in current direction
    offset.set(x + offset.x, y + offset.y, z + offset.z);

    // orientations

    x = Math.random() * 20 - 1;
    y = Math.random() * 20 - 1;
    z = Math.random() * 20 - 1;
    w = Math.random() * 20 - 1;

    orientation.set(x, y, z, w).normalize();

    matrix.compose(offset, orientation, scale);

    instancedMesh.setMatrixAt(i, matrix);
    instancedMesh.setColorAt(i, rainbowColors[(i * 100) % rainbowColors.length]);

    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  return instancedMesh;
};
