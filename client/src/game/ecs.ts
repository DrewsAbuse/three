import {Vector3} from 'three';
import type {PerspectiveCamera, Scene} from 'three';
import type {Component, Data} from './component.ts';
import type {WebGPURenderer} from './web-gup.ts';
import {cameraSystem} from './systems/camera.ts';
import {inputSystem} from './systems/keys.ts';
import {movementSystem} from './systems/movement.ts';
import {createSkybox} from './skybox.ts';
import {getKeysSet} from './keys-input.ts';
import {getAutoIncrementIdGenerator} from './helpers';

export type EntityArray = [number, number, number, number, ...Data[]];
type TwoDimensionalArray = [Record<number, number>, ...EntityArray[]][];
type MapComponentsMaskToArchetype = Map<
  number,
  {
    bitMaskToIndex: Map<number, number>;
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
  keySets = getKeysSet();
  inputSystemUpdateId = -1;

  mapComponentsMaskToArchetype: MapComponentsMaskToArchetype = new Map();
  mapComponentMaskToArchetypeMask: Map<number, number> = new Map();

  normalizedVector3X = new Vector3(1, 0, 0);
  normalizedVector3Y = new Vector3(0, 1, 0);
  normalizedVector3Z = new Vector3(0, 0, 1);

  isDeletedInit = 0;
  isDirtyInit = 0;

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
    entityArray: EntityArray;
    partitionBitMaskToIndex: Record<number, number>;
  } => {
    const entityArray = new Array(4 + sortedComponents.length) as EntityArray;
    const componentsBitMaskToIndex: Record<number, number> = {};
    let partialComponentsBitMask = 0;

    entityArray[0] = this.getEntityAutoIncrementId();
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

    return {entityArray, partitionBitMaskToIndex: componentsBitMaskToIndex};
  };

  createEntity(components: Component[]) {
    const componentsBitMask = components.reduce((acc, component) => acc | component.bitMask, 0);
    const sortedComponents = components.sort((a, b) => a.bitMask - b.bitMask);

    this.mapComponentsMaskToArchetype.forEach((archetype, archetypeKeyComponentsMask) => {
      if ((archetypeKeyComponentsMask & componentsBitMask) === archetypeKeyComponentsMask) {
        const {entityArray, partitionBitMaskToIndex} = this.createEntityArray(
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

        return;
      }
    });

    this.createArchetype({components: sortedComponents, componentsBitMask});
  }

  createArchetype({
    componentsBitMask,
    components,
  }: {
    components: Component[];
    componentsBitMask: number;
  }) {
    const {entityArray, partitionBitMaskToIndex} = this.createEntityArray(
      components,
      componentsBitMask
    );

    const twoDimensionalArray: TwoDimensionalArray = [[partitionBitMaskToIndex, entityArray]];
    const bitMaskToIndex = new Map([[componentsBitMask, 0]]);

    this.mapComponentsMaskToArchetype.set(componentsBitMask, {
      bitMaskToIndex,
      twoDimensionalArray,
    });
  }

  getArchetypePartitionByComponentsMask(componentMask: number) {
    const query = this.mapComponentMaskToArchetypeMask.get(componentMask)!;

    const {twoDimensionalArray, bitMaskToIndex} = this.mapComponentsMaskToArchetype.get(query)!;

    const subArrayIndex = bitMaskToIndex.get(query);

    if (subArrayIndex === undefined) {
      throw new Error(`componentMask ${componentMask} not found, query ${query}`);
    }

    return twoDimensionalArray[subArrayIndex];
  }

  inputSystem = inputSystem;
  movementSystem = movementSystem;
  cameraSystem = cameraSystem;

  abstract runSystems(timeElapsed: number): void;
}

export class ClientWorld extends World {
  renderer: WebGPURenderer;
  scene: Scene;
  camera: PerspectiveCamera;

  constructor({
    renderer,
    camera,
    scene,
  }: {
    renderer: WebGPURenderer;
    scene: Scene;
    camera: PerspectiveCamera;
  }) {
    super();
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.keySets = getKeysSet();
    this.scene.background = createSkybox();
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
        console.log(
          `inputSystemUpdateId ${this.inputSystemUpdateId} ${this.keySets.keySetUpdateId}`
        );

        this.inputSystem();

        this.inputSystemUpdateId = this.keySets.keySetUpdateId[0];
      }
      this.movementSystem(timeElapsedS);
      this.cameraSystem(timeElapsedS);
    }
  }
}
