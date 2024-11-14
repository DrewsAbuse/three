import {AmbientLight, Group, InstancedMesh, Mesh, Object3D, Scene} from 'three';
import Stats from 'stats.js';
import type {WebGLRenderer} from 'three';
import {Component, ComponentIdToData, componentIdsEnum} from '../components';
import {CameraSystem, UIWriteSystem} from '../systems';
import {FIXED_TIME_STEP, SYSTEM_STEP} from '../env.ts';
import {skybox} from '../../assets/sky-box/skybox.ts';
import {EntityArray} from '../types';
import {ArchetypeStorage} from '../storage/index.ts';
import {World} from './base.ts';
import {WebGPURenderer, webGPURenderer} from './web-gup.ts';

export class ClientWorld extends World {
  renderSystemUpdateId = -1;
  renderer: WebGPURenderer | WebGLRenderer;

  stats = new Stats();
  scene = new Scene();
  sceneEntities: {
    updateId: [0];
    meshToAdd: Component['data'][];
    meshToDelete: Component['data'][];
    addMesh: (data: Component['data']) => void;
    deleteMesh: (data: Component['data']) => void;
  } = {
    updateId: [0],
    meshToAdd: [],
    meshToDelete: [],
    addMesh: (data: Component['data']) => {
      this.sceneEntities.meshToAdd.push(data);
      this.sceneEntities.updateId[0]++;
    },
    deleteMesh: (data: Component['data']) => {
      this.sceneEntities.meshToDelete.push(data);
      this.sceneEntities.updateId[0]++;
    },
  };

  systemStep = SYSTEM_STEP;
  fixedTimeStep = FIXED_TIME_STEP;

  cameraSystem = new CameraSystem();
  uiWriteSystem = new UIWriteSystem();

  constructor(storage: ArchetypeStorage) {
    super(storage);

    this.renderer = webGPURenderer;

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game')?.appendChild(this.renderer.domElement);

    this.scene.add(this.cameraSystem.camera);

    this.scene.background = skybox;

    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom).style.position = 'absolute';

    const light = new AmbientLight(0x404040);

    this.scene.add(light);
  }

  requestAnimationFrameFixedTimeStep = (
    previousRAFFixedUpdate: number = 0,
    accumulator = 0,
    previousRAF: number = 0
  ) =>
    requestAnimationFrame(t => {
      this.stats.begin();
      const deltaTime = t - previousRAF;
      previousRAF = t;
      accumulator += deltaTime;

      // Run fixed time updates
      while (accumulator >= this.fixedTimeStep) {
        this.runSystems();
        accumulator -= this.fixedTimeStep;
        if (!(accumulator >= this.fixedTimeStep)) {
          accumulator = 0;
        }
      }
      // Render the frame
      this.renderer.render(this.scene, this.cameraSystem.camera);

      this.stats.end();

      // Recursively call requestAnimationFrame
      this.requestAnimationFrameFixedTimeStep(previousRAFFixedUpdate, accumulator, previousRAF);
    });

  createEntityAndAddToScene(params: {entityArray: EntityArray; componentsId: Uint16Array}) {
    this.storage.insertEntities({
      entities: [params.entityArray],
      componentIds: params.componentsId,
    });
    const meshComponentIndex = params.componentsId.findIndex(
      bitMask => bitMask === componentIdsEnum.mesh || bitMask === componentIdsEnum.instancedMesh
    );

    if (meshComponentIndex !== -1) {
      this.sceneEntities.addMesh(params.entityArray[meshComponentIndex + 3]);
    }

    const uiWriteComponentIndex = params.componentsId.indexOf(componentIdsEnum.uiWrite);

    if (uiWriteComponentIndex !== -1) {
      const {signalIds, signalIdToSetter} = params.entityArray[
        uiWriteComponentIndex + 3
      ] as ComponentIdToData[componentIdsEnum.uiWrite];

      for (const signalId of signalIds) {
        const {updateId: signalVersion} = signalIdToSetter[signalId];

        this.uiWriteSystem.signalIdToLastUpdatedVersion.set(signalId, signalVersion);
      }
    }
  }

  renderSceneSystem() {
    this.sceneEntities.meshToAdd.forEach(mesh => {
      if (
        mesh instanceof Mesh ||
        mesh instanceof Group ||
        mesh instanceof InstancedMesh ||
        mesh instanceof Object3D
      ) {
        this.scene.add(mesh);
        this.grid.insert(mesh);

        return;
      }

      throw new Error(`RenderSceneSystem-meshToAdd: mesh is not instance of Mesh`);
    });

    this.sceneEntities.meshToDelete.forEach(mesh => {
      this.scene.remove(mesh as Mesh);
      this.grid.remove(mesh as Mesh);
    });

    this.sceneEntities.meshToAdd.length = 0;
    this.sceneEntities.meshToDelete.length = 0;
  }

  runSystems() {
    if (this.renderSystemUpdateId !== this.sceneEntities.updateId[0]) {
      this.renderSystemUpdateId = this.sceneEntities.updateId[0];
      this.renderSceneSystem();
    }

    this.storage.applyTickToEntitiesByComponentIds({
      systemStep: this.systemStep,
      componentIds: this.movementsSystemRunner.requiredComponents,
      system: this.movementsSystemRunner,
    });
    this.storage.applyTickToEntitiesByComponentIds({
      systemStep: this.systemStep,
      componentIds: this.cameraSystem.requiredComponents,
      system: this.cameraSystem,
    });
    this.storage.applyTickToEntitiesByComponentIds({
      systemStep: this.systemStep,
      componentIds: this.uiWriteSystem.requiredComponents,
      system: this.uiWriteSystem,
    });
    this.storage.applyTickToEntitiesByComponentIds({
      systemStep: this.systemStep,
      componentIds: this.collisionSystem.requiredComponents,
      system: this.collisionSystem,
    });
  }
}
