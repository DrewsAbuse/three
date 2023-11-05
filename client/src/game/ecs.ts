import {Vector3} from 'three';
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
type TwoDimensionalArray = [Record<number, number>, ...EntityArray[]][];
type MapComponentsMaskToArchetype = Map<
  number,
  {
    bitMaskToIndex: Map<number, number>;
    entityIdToIndex: Map<number, number>;
    twoDimensionalArray: TwoDimensionalArray;
  }
>;

export class Entity {
  static autoIncrementId = 0;
  id: number;

  constructor() {
    this.id = Entity.autoIncrementId++;
  }
}

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

  defaultComponentIndex = {
    id: 0,
    isDeleted: 1,
    isDirty: 2,
  } as const;

  offsetForEntityArrayDefaults = 4;
  archetypePartitionStartIndex = 1;

  controlsValue = {
    axis1Forward: 0.0,
    axis1Side: 0.0,
    pageUp: false,
    pageDown: false,
    space: false,
    shift: false,
    backspace: false,
  };

  createEntityArray = (
    sortedComponents: Component[],
    componentsBitMask: number,
    archetypeKeyComponentsMask?: number
  ): {
    entityId: number;
    entityArray: EntityArray;
    partitionBitMaskToIndex: Record<number, number>;
  } => {
    const entityId = this.getEntityAutoIncrementId();
    this.mapEntityIdTomapComponentsMask.set(entityId, componentsBitMask);

    const entityArray = new Array(4 + sortedComponents.length) as EntityArray;
    const componentsBitMaskToIndex: Record<number, number> = {};
    let partialComponentsBitMask = 0;

    entityArray[0] = entityId;
    entityArray[1] = this.isDeletedInit;
    entityArray[2] = this.isDirtyInit;
    entityArray[3] = componentsBitMask;

    for (let i = 0; i < sortedComponents.length; i++) {
      const {bitMask, data} = sortedComponents[i];

      partialComponentsBitMask |= bitMask;

      componentsBitMaskToIndex[bitMask] = i + this.offsetForEntityArrayDefaults;
      entityArray[i + this.offsetForEntityArrayDefaults] = data;

      this.mapComponentMaskToArchetypeMask.set(
        partialComponentsBitMask,
        archetypeKeyComponentsMask ?? componentsBitMask
      );
    }

    return {entityId, entityArray, partitionBitMaskToIndex: componentsBitMaskToIndex};
  };

  createEntity(components: Component[]) {
    const componentsBitMask = components.reduce((acc, component) => acc | component.bitMask, 0);
    const sortedComponents = components.sort((a, b) => a.bitMask - b.bitMask);

    let isArchetypeFound = false;

    this.mapComponentsMaskToArchetype.forEach((archetype, archetypeKeyComponentsMask) => {
      if ((archetypeKeyComponentsMask & componentsBitMask) === archetypeKeyComponentsMask) {
        isArchetypeFound = true;
        const {entityArray, partitionBitMaskToIndex, entityId} = this.createEntityArray(
          sortedComponents,
          componentsBitMask,
          archetypeKeyComponentsMask
        );

        const index = archetype.bitMaskToIndex.get(componentsBitMask);

        if (index !== undefined) {
          archetype.twoDimensionalArray[index].push(entityArray);
        } else {
          archetype.bitMaskToIndex.set(
            componentsBitMask,
            archetype.twoDimensionalArray.push([partitionBitMaskToIndex, entityArray]) - 1
          );
        }

        archetype.entityIdToIndex.set(entityId, archetype.twoDimensionalArray.length - 1);

        return;
      }
    });

    if (!isArchetypeFound) {
      this.createArchetype({
        componentsBitMask,
        components: sortedComponents,
      });
    }
  }

  createArchetype({
    componentsBitMask,
    components,
  }: {
    components: Component[];
    componentsBitMask: number;
  }) {
    const {entityArray, partitionBitMaskToIndex, entityId} = this.createEntityArray(
      components,
      componentsBitMask
    );

    const twoDimensionalArray: TwoDimensionalArray = [[partitionBitMaskToIndex, entityArray]];
    const bitMaskToIndex = new Map([[componentsBitMask, 0]]);
    const entityIdToIndex = new Map([[entityId, 0]]);

    this.mapComponentsMaskToArchetype.set(componentsBitMask, {
      bitMaskToIndex,
      entityIdToIndex,
      twoDimensionalArray,
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

  getEntity({entityId, componentsMask}: {entityId: number; componentsMask: number}) {
    const query = this.mapComponentMaskToArchetypeMask.get(componentsMask)!;

    const {twoDimensionalArray, bitMaskToIndex, entityIdToIndex} =
      this.mapComponentsMaskToArchetype.get(query)!;

    const subArrayIndex = bitMaskToIndex.get(query);

    if (subArrayIndex === undefined) {
      throw new Error(`componentsMask ${componentsMask} not found, query ${query}`);
    }

    const partition = twoDimensionalArray[subArrayIndex];
    const entityIndex = entityIdToIndex.get(entityId);

    if (entityIndex === undefined) {
      throw new Error(`entityId ${entityId} not found`);
    }

    return {
      entity: partition[entityIndex],
      componentsIndexes: partition[0],
    };
  }

  deleteEntity(entityId: number) {
    const componentsMask = this.mapEntityIdTomapComponentsMask.get(entityId);

    if (componentsMask === undefined) {
      throw new Error(`entityId ${entityId} not found`);
    }

    const {entity, componentsIndexes} = this.getEntity({entityId, componentsMask});

    entity[this.defaultComponentIndex.isDeleted] = 1;

    return {
      entity,
      componentsIndexes,
    };
  }

  clenUpArchetypes() {
    //Sort (using quick sort) all deleted entities to the end of the array and live entities to the beginning

    this.mapComponentsMaskToArchetype.forEach(archetype => {
      archetype.twoDimensionalArray.forEach(subArray => {
        let left = this.archetypePartitionStartIndex;
        let right = subArray.length - 1;

        while (left < right) {
          while (left < right && subArray[left][this.defaultComponentIndex.isDeleted] === 0) {
            left++;
          }

          while (left < right && subArray[right][this.defaultComponentIndex.isDeleted] === 1) {
            right--;
          }

          if (left < right) {
            const temp = subArray[left];
            subArray[left] = subArray[right];
            subArray[right] = temp;
          }
        }
      });
    });

    console.log(`this.mapComponentsMaskToArchetype`, this.mapComponentsMaskToArchetype);
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

      if (this.inputSystemUpdateId !== this.keySets.keySetUpdateId[0]) {
        this.inputSystem();
        this.inputSystemUpdateId = this.keySets.keySetUpdateId[0];
      }

      if (this.renderSystemUpdateId !== this.sceneEntities.updateId[0]) {
        this.renderSceneSystem();
        this.renderSystemUpdateId = this.sceneEntities.updateId[0];
      }

      this.movementSystem(timeElapsedS);
      this.cameraSystem(timeElapsedS);
    }
  }

  deleteEntityAndRemoveFromScene(entityId: number) {
    const {entity, componentsIndexes} = this.deleteEntity(entityId);

    const meshComponent = entity[componentsIndexes[componentTypeToBitMask.mesh]];

    if (meshComponent === undefined) {
      throw new Error(`meshComponent not found`);
    }

    this.sceneEntities.deleteMesh(meshComponent);
    this.sceneEntities.updateId[0]++;
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
}
