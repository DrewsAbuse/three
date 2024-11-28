import {BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Quaternion, Vector3} from 'three';
import {PLAYER} from '@abuse/constants';
import type {EntityInput} from '../types';
import type {ComponentIdToData, MovementComponentData} from '../components';
import {
  Component,
  componentIdsEnum,
  keysInputComponent,
  movementComponentDataIndexes,
} from '../components';
import {signalsRegistrar} from '../../GUI/signals.ts';
import {GLTFToVoxels} from '../../libs/@shared/helpers/models/gltf-to-voxels.ts';
import {autoIncrementId} from '../helpers';

const voxelSize = 0.25;

const voxelizer = new GLTFToVoxels(voxelSize);

const scale = 4;

const instanced = voxelizer.createInstancedMesh(
  await voxelizer
    .loadModel('models/star_fox/scene.gltf', scale, {
      x: 0,
      y: Math.PI,
      z: 0,
    })
    .then(({mesh}) => mesh),
  scale
);
instanced.rotation.y = Math.PI;

export const {MOVE_ACCELERATION, MOVE_DECELERATION, ROTATION_ACCELERATION, ROTATION_DECELERATION} =
  PLAYER.MOVE;

export const forwardAcceleration = signalsRegistrar.createSignal<number>(MOVE_ACCELERATION.z);
export const forwardDeceleration = signalsRegistrar.createSignal<number>(MOVE_DECELERATION.z);

export const createPlayer = (): EntityInput => {
  const meshComponent = new Component({
    data: new Mesh(new BoxGeometry(5, 5, 5), new MeshBasicMaterial({color: 0x00ff00})),
    id: componentIdsEnum.mesh,
  });

  const moveData: ComponentIdToData[componentIdsEnum.movement] = [
    new Vector3(),
    new Vector3(MOVE_ACCELERATION.x, MOVE_ACCELERATION.y, MOVE_ACCELERATION.z),
    new Vector3(MOVE_DECELERATION.x, MOVE_DECELERATION.y, MOVE_DECELERATION.z),
    new Vector3(),
    new Vector3(ROTATION_ACCELERATION.x, ROTATION_ACCELERATION.y, ROTATION_ACCELERATION.z),
    new Vector3(ROTATION_DECELERATION.x, ROTATION_DECELERATION.y, ROTATION_DECELERATION.z),
  ];

  const movementComponent = new Component({
    data: moveData,
    id: componentIdsEnum.movement,
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
    id: componentIdsEnum.camera,
  });

  const UIWriteComponent = new Component({
    id: componentIdsEnum.uiWrite,
    data: {
      signalIds: [forwardAcceleration.id, forwardDeceleration.id],
      signalIdToSetter: {
        [forwardAcceleration.id]: {
          updateId: forwardAcceleration.setterVersion,
          setter({value, partition, idToComponentOffset, index}) {
            const movement = partition[
              index + idToComponentOffset[componentIdsEnum.movement]
            ] as MovementComponentData;

            movement[movementComponentDataIndexes.accelerationMove].z = value as number;
          },
        },
        [forwardDeceleration.id]: {
          updateId: forwardDeceleration.setterVersion,
          setter({value, partition, idToComponentOffset, index}) {
            const movement = partition[
              index + idToComponentOffset[componentIdsEnum.movement]
            ] as MovementComponentData;

            movement[movementComponentDataIndexes.decelerationMove].z = value as number;
          },
        },
      },
    },
  });
  const UIReadComponent = new Component({
    id: componentIdsEnum.uiRead,
    data: true,
  });

  const components = [
    keysComponent,
    meshComponent,
    movementComponent,
    cameraComponent,
    UIWriteComponent,
    UIReadComponent,
  ];
  const sortedComponents = components.sort((a, b) => a.id - b.id);

  return {
    componentsId: new Uint16Array(sortedComponents.map(({id}) => id)),
    entityArray: [
      autoIncrementId() || 666,
      0,
      0,
      ...sortedComponents.map(component => component.data),
    ],
  };
};

export const player = createPlayer();
