import {Quaternion, Vector3} from 'three';
import type {Mesh, PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import type {Component, Data} from './component.ts';
import type {WebGPURenderer} from './web-gup.ts';
import {cameraSystem} from './systems/camera.ts';
import {inputSystem} from './systems/keys.ts';
import {movementSystem} from './systems/movement.ts';
import {createSkybox} from './skybox.ts';
import {getKeysSet} from './keys-input.ts';
import {getAutoIncrementIdGenerator} from './helpers';
import {componentTypeToBitMask} from './component.ts';

export type EntityArray = [number, number, number, number, ...Data[]];

type TwoDimensionalArray = [number, Record<number, number>, ...EntityArray][];
type MapComponentsMaskToArchetype = Map<
  number,
  {
    bitMaskToIndex: Map<number, number>;
    entityIdToIndex: Map<number, number>;
    twoDimensionalArray: TwoDimensionalArray;
  }
>;

export abstract class World {
  getEntityAutoIncrementId = getAutoIncrementIdGenerator();

  mapComponentsMaskToArchetype: MapComponentsMaskToArchetype = new Map();
  mapComponentMaskToArchetypeMask: Map<number, number> = new Map();
  mapEntityIdTomapComponentsMask: Map<number, number> = new Map();

  normalizedVector3X = new Vector3(1, 0, 0);
  normalizedVector3Y = new Vector3(0, 1, 0);
  normalizedVector3Z = new Vector3(0, 0, 1);

  isDeletedInit = 0;
  isDirtyInit = 0;

  partitionStartIndex = 2;
  partitionDefaultsOffset = this.partitionStartIndex + 1;
  offsetForEntityArrayDefaults = 4;

  controlsValue = {
    axis1Forward: 0.0,
    axis1Side: 0.0,
    pageUp: false,
    pageDown: false,
    space: false,
    shift: false,
    backspace: false,
  };

  insertEntity({
    entityId,
    sortedComponents,
    componentsBitMask,
    partition,
    entityIdToIndex,
  }: {
    entityId: number;
    sortedComponents: Component[];
    componentsBitMask: number;
    partition: TwoDimensionalArray[number];
    entityIdToIndex: Map<number, number>;
  }): void {
    let lastInsertIndex = partition[0];
    this.mapEntityIdTomapComponentsMask.set(entityId, componentsBitMask);

    partition[++lastInsertIndex] = entityId;
    entityIdToIndex.set(entityId, lastInsertIndex);

    partition[++lastInsertIndex] = this.isDeletedInit;
    partition[++lastInsertIndex] = this.isDirtyInit;
    partition[++lastInsertIndex] = componentsBitMask;

    for (let i = 0; i < sortedComponents.length; i++) {
      const {data} = sortedComponents[i];

      partition[++lastInsertIndex] = data;
    }

    partition[0] = lastInsertIndex;
  }

  createEntity(components: Component[]) {
    const componentsBitMask = components.reduce((acc, component) => acc | component.bitMask, 0);
    const sortedComponents = components.sort((a, b) => a.bitMask - b.bitMask);
    const entityId = this.getEntityAutoIncrementId();

    let isArchetypeFound = false;

    this.mapComponentsMaskToArchetype.forEach((archetype, archetypeKeyComponentsMask) => {
      if ((archetypeKeyComponentsMask & componentsBitMask) === archetypeKeyComponentsMask) {
        isArchetypeFound = true;

        const index = archetype.bitMaskToIndex.get(componentsBitMask);

        if (index !== undefined) {
          this.insertEntity({
            entityId,
            sortedComponents,
            componentsBitMask,
            partition: archetype.twoDimensionalArray[index],
            entityIdToIndex: archetype.entityIdToIndex,
          });
        } else {
          archetype.bitMaskToIndex.set(
            componentsBitMask,
            archetype.twoDimensionalArray.push(
              this.createPartitionWithEntity({
                componentsBitMask,
                sortedComponents,
                entityId,
                entityIdToIndex: archetype.entityIdToIndex,
                archetypeKeyComponentsMask,
              })
            ) - 1
          );
        }
      }
    });

    if (!isArchetypeFound) {
      this.createArchetype({
        componentsBitMask,
        components: sortedComponents,
      });
    }
  }

  createPartitionWithEntity({
    componentsBitMask,
    sortedComponents,
    entityId,
    entityIdToIndex,
    archetypeKeyComponentsMask,
  }: {
    sortedComponents: Component[];
    componentsBitMask: number;
    entityId: number;
    entityIdToIndex: Map<number, number>;
    archetypeKeyComponentsMask: number;
  }) {
    let currentInsertIndex = this.partitionStartIndex;
    const entityLength = this.offsetForEntityArrayDefaults + sortedComponents.length;

    const partition = new Array<Record<number, number> | Data>(
      this.partitionStartIndex + entityLength
    );
    this.mapEntityIdTomapComponentsMask.set(entityId, componentsBitMask);

    const componentsBitMaskToIndex: Record<number, number> = {};
    let partialComponentsBitMask = 0;

    partition[++currentInsertIndex] = entityId;
    entityIdToIndex.set(entityId, currentInsertIndex);

    partition[++currentInsertIndex] = this.isDeletedInit;
    partition[++currentInsertIndex] = this.isDirtyInit;
    partition[++currentInsertIndex] = componentsBitMask;

    for (let i = 0; i < sortedComponents.length; i++) {
      const {bitMask, data} = sortedComponents[i];

      partialComponentsBitMask |= bitMask;
      componentsBitMaskToIndex[bitMask] = i + this.offsetForEntityArrayDefaults;

      partition[++currentInsertIndex] = data;

      this.mapComponentMaskToArchetypeMask.set(
        partialComponentsBitMask,
        archetypeKeyComponentsMask
      );
    }

    partition[0] = currentInsertIndex;
    partition[1] = componentsBitMaskToIndex;
    partition[2] = entityLength;

    return partition as TwoDimensionalArray[number];
  }

  createArchetype({
    componentsBitMask,
    components: sortedComponents,
  }: {
    components: Component[];
    componentsBitMask: number;
  }) {
    let currentInsertIndex = this.partitionStartIndex;
    const entityLength = this.offsetForEntityArrayDefaults + sortedComponents.length;

    const twoDimensionalArray = [
      new Array<Record<number, number> | Data>(this.partitionStartIndex + entityLength),
    ];
    const entityId = this.getEntityAutoIncrementId();

    this.mapEntityIdTomapComponentsMask.set(entityId, componentsBitMask);

    const componentsBitMaskToIndex: Record<number, number> = {};
    let partialComponentsBitMask = 0;

    twoDimensionalArray[0][++currentInsertIndex] = entityId;
    const entityIdToIndex = new Map([[entityId, currentInsertIndex]]);

    twoDimensionalArray[0][++currentInsertIndex] = this.isDeletedInit;
    twoDimensionalArray[0][++currentInsertIndex] = this.isDirtyInit;
    twoDimensionalArray[0][++currentInsertIndex] = componentsBitMask;

    for (let i = 0; i < sortedComponents.length; i++) {
      const {bitMask, data} = sortedComponents[i];

      partialComponentsBitMask |= bitMask;

      twoDimensionalArray[0][++currentInsertIndex] = data;
      componentsBitMaskToIndex[bitMask] = i + this.offsetForEntityArrayDefaults;

      this.mapComponentMaskToArchetypeMask.set(partialComponentsBitMask, componentsBitMask);
    }

    twoDimensionalArray[0][0] = currentInsertIndex;
    twoDimensionalArray[0][1] = componentsBitMaskToIndex;
    twoDimensionalArray[0][2] = entityLength;

    this.mapComponentsMaskToArchetype.set(componentsBitMask, {
      twoDimensionalArray: twoDimensionalArray as TwoDimensionalArray,
      entityIdToIndex,
      bitMaskToIndex: new Map([[componentsBitMask, 0]]),
    });
  }

  getArchetypePartitionByStrictComponentsMask(componentsMasks: number[]) {
    const maskForFind = componentsMasks.reduce((acc, componentMask) => acc | componentMask, 0);

    const query = this.mapComponentMaskToArchetypeMask.get(maskForFind)!;

    const {twoDimensionalArray, bitMaskToIndex} = this.mapComponentsMaskToArchetype.get(query)!;

    const subArrayIndex = bitMaskToIndex.get(maskForFind);

    if (subArrayIndex === undefined) {
      throw new Error(`componentsMask ${maskForFind} not found, query ${query}`);
    }

    return twoDimensionalArray[subArrayIndex];
  }

  getArchetypePartitionByComponentsMasks(componentsMask: number[]) {
    const maskForFind = componentsMask.reduce((acc, componentMask) => acc | componentMask, 0);

    const query = this.mapComponentMaskToArchetypeMask.get(maskForFind)!;

    const {twoDimensionalArray, bitMaskToIndex} = this.mapComponentsMaskToArchetype.get(query)!;

    let subArrayIndex;

    for (const [mask, index] of bitMaskToIndex) {
      if ((mask | maskForFind) === mask) {
        subArrayIndex = index;
        break;
      }
    }

    if (subArrayIndex === undefined) {
      throw new Error(`componentsMask ${maskForFind} not found, query ${query}`);
    }

    return twoDimensionalArray[subArrayIndex];
  }

  inputSystem = inputSystem;
  movementSystem = movementSystem;
  cameraSystem = cameraSystem;

  abstract runSystems(timeElapsed: number): void;
}

export class ClientWorld extends World {
  inputSystemUpdateId = -1;
  keySets = getKeysSet();
  renderSystemUpdateId = -1;
  renderer: WebGPURenderer | WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  sceneEntities: {
    updateId: [0];
    meshToAdd: Component['data'][];
    meshToDelete: Component['data'][];
    addMesh: (mesh: Component['data']) => void;
    deleteMesh: (mesh: Component['data']) => void;
  };

  constructor({
    renderer,
    camera,
    scene,
  }: {
    renderer: WebGPURenderer | WebGLRenderer;
    scene: Scene;
    camera: PerspectiveCamera;
  }) {
    super();
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.keySets = getKeysSet();
    this.scene.background = createSkybox();
    this.sceneEntities = {
      updateId: [0],
      meshToAdd: [],
      meshToDelete: [],
      addMesh: (mesh: Component['data']) => {
        this.sceneEntities.meshToAdd.push(mesh);
        this.sceneEntities.updateId[0]++;
      },
      deleteMesh: (mesh: Component['data']) => {
        this.sceneEntities.meshToDelete.push(mesh);
        this.sceneEntities.updateId[0]++;
      },
    };
  }
  requestAnimationFrameWithElapsedTime = (previousRAF: number | null = null) => {
    requestAnimationFrame(t => {
      if (previousRAF === null) {
        previousRAF = t;
      }

      this.runSystems(t - previousRAF);
      this.renderer.render(this.scene, this.camera);
      previousRAF = t;

      setTimeout(() => {
        this.requestAnimationFrameWithElapsedTime(previousRAF);
      }, 1);
    });
  };

  runSystems(timeElapsed: number) {
    {
      const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

      if (this.renderSystemUpdateId !== this.sceneEntities.updateId[0]) {
        this.renderSceneSystem();
        this.renderSystemUpdateId = this.sceneEntities.updateId[0];
      }

      if (this.inputSystemUpdateId !== this.keySets.keySetUpdateId[0]) {
        this.inputSystem();
        this.inputSystemUpdateId = this.keySets.keySetUpdateId[0];
      }

      this.movementSystem(timeElapsedS);
      this.cameraSystem(timeElapsedS);
      this.flightByCircleOrbitCubeSystem();
    }
  }

  createEntityAndAddToScene(components: Component[]) {
    this.createEntity(components);
    const meshComponent = components.find(
      component => component.bitMask === componentTypeToBitMask.mesh
    );

    if (meshComponent === undefined) {
      throw new Error(`meshComponent not found`);
    }

    this.sceneEntities.addMesh(meshComponent.data);
  }

  renderSceneSystem() {
    this.sceneEntities.meshToAdd.forEach(mesh => {
      this.scene.add(mesh as Mesh);
    });

    this.sceneEntities.meshToDelete.forEach(mesh => {
      this.scene.remove(mesh as Mesh);
    });

    this.sceneEntities.meshToAdd.length = 0;
    this.sceneEntities.meshToDelete.length = 0;
  }

  flightByCircleOrbitCubeSystem() {
    const archetypePartition = this.getArchetypePartitionByStrictComponentsMask([
      componentTypeToBitMask.mesh,
      componentTypeToBitMask.radius,
    ]);

    const componentsIndexes = archetypePartition[1];
    const entityLength = archetypePartition[2];

    const meshComponentIndex = componentsIndexes[componentTypeToBitMask.mesh];
    const radiusComponentIndex = componentsIndexes[componentTypeToBitMask.radius];

    const quaternionNew = new Quaternion();
    const vector3Tmp = new Vector3();

    for (let i = this.partitionDefaultsOffset; i < archetypePartition.length; i += entityLength) {
      const mesh = archetypePartition[i + meshComponentIndex] as Mesh;
      const radius = archetypePartition[i + radiusComponentIndex] as {x: number; y: number};

      vector3Tmp.set(radius.x, radius.y, 0);
      quaternionNew.setFromAxisAngle(this.normalizedVector3Y, Math.PI * 0.01);
      vector3Tmp.applyQuaternion(quaternionNew);
      vector3Tmp.add(mesh.position);
      quaternionNew.setFromAxisAngle(this.normalizedVector3X, Math.PI * 0.01);
      mesh.quaternion.multiply(quaternionNew);

      mesh.position.set(vector3Tmp.x, vector3Tmp.y, vector3Tmp.z);
    }
  }
}

export const createRandomRadiusCircleOrbit = (): {
  x: number;
  y: number;
} => {
  const radius = Math.random() * 0.5;
  const angle = Math.random() * Math.PI * 0.5;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
};
