import {Mesh, Object3D, Quaternion, Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {EntityInput} from '../types';
import type {ComponentIdToTypes, MovementComponentData} from '../components';
import {movementComponentDataIndexes} from '../components';
import {componentIds} from '../components';
import {Component, keysInputComponent} from '../components';
import {autoIncrementId} from '../helpers';
import {player as playerJSON} from '../env.ts';
import {signalsRegistrar} from '../../GUI/signals.ts';

const gltfLoader = new GLTFLoader();

//TODO: Implement proper import and loading of models
export const model = await gltfLoader.loadAsync('models/star_fox/scene.gltf').then(gltf => {
  gltf.scene.scale.set(12, 12, 12);
  gltf.scene.rotateY(Math.PI);

  return gltf.scene;
});

export const {MOVE_ACCELERATION, MOVE_DECELERATION, ROTATION_ACCELERATION, ROTATION_DECELERATION} =
  playerJSON.MOVE;

export const forwardAcceleration = signalsRegistrar.createSignal<number>(MOVE_ACCELERATION.z);
export const forwardDeceleration = signalsRegistrar.createSignal<number>(MOVE_DECELERATION.z);

export const createPlayer = (): EntityInput => {
  const mesh = new Mesh();
  mesh.add(model);

  const meshComponent = new Component({
    data: mesh,
    id: componentIds.mesh,
  });

  const moveData: ComponentIdToTypes[componentIds.movement] = [
    new Vector3(),
    new Vector3(MOVE_ACCELERATION.x, MOVE_ACCELERATION.y, MOVE_ACCELERATION.z),
    new Vector3(MOVE_DECELERATION.x, MOVE_DECELERATION.y, MOVE_DECELERATION.z),
    new Vector3(),
    new Vector3(ROTATION_ACCELERATION.x, ROTATION_ACCELERATION.y, ROTATION_ACCELERATION.z),
    new Vector3(ROTATION_DECELERATION.x, ROTATION_DECELERATION.y, ROTATION_DECELERATION.z),
  ];

  const movementComponent = new Component({
    data: moveData,
    id: componentIds.movement,
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
    id: componentIds.camera,
  });

  const UIWriteComponent = new Component({
    id: componentIds.uiWrite,
    data: {
      signalIds: [forwardAcceleration.id, forwardDeceleration.id],
      signalIdToSetter: {
        [forwardAcceleration.id]: {
          updateId: forwardAcceleration.setterVersion,
          setter: ({value, partition, idToComponentOffset, index}) => {
            const movement = partition[
              index + idToComponentOffset[componentIds.movement]
            ] as MovementComponentData;

            movement[movementComponentDataIndexes.accelerationMove].z = value as number;
          },
        },
        [forwardDeceleration.id]: {
          updateId: forwardDeceleration.setterVersion,
          setter: ({value, partition, idToComponentOffset, index}) => {
            const movement = partition[
              index + idToComponentOffset[componentIds.movement]
            ] as MovementComponentData;

            movement[movementComponentDataIndexes.decelerationMove].z = value as number;
          },
        },
      },
    },
  });
  const UIReadComponent = new Component({
    id: componentIds.uiRead,
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
    entityArray: [autoIncrementId(), 0, 0, ...sortedComponents.map(component => component.data)],
  };
};

export const player = createPlayer();
