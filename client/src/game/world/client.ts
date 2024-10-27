import {AmbientLight, Group, InstancedMesh, Mesh, Object3D} from 'three';
import Stats from 'stats.js';
import {Scene} from 'three';
import type {WebGLRenderer} from 'three';
import type {Component} from '../components';
import type {EntityArray} from '../types';
import type {WebGPURenderer} from '../helpers';
import type {ArchetypeStorage} from './storage.ts';
import {webGPURenderer} from '../helpers';
import {componentIds} from '../components';
import {createSkybox} from '../helpers';
import {CameraSystem} from '../systems';
import {SpatialHashGrid} from '../helpers/grid.ts';
import {FIXED_TIME_STEP, SYSTEM_STEP} from '../env.ts';
import {World} from './base.ts';

export class ClientWorld extends World {
  renderSystemUpdateId = -1;
  renderer: WebGPURenderer | WebGLRenderer;

  stats = new Stats();
  scene = new Scene();
  sceneEntities: {
    updateId: [0];
    meshToAdd: Component['data'][];
    meshToDelete: Component['data'][];
    addMesh: (mesh: Component['data']) => void;
    deleteMesh: (mesh: Component['data']) => void;
  };

  systemStep = SYSTEM_STEP;
  fixedTimeStep = FIXED_TIME_STEP;

  cameraSystem = new CameraSystem();

  grid = new SpatialHashGrid();

  constructor(storage: ArchetypeStorage) {
    super(storage);

    this.renderer = webGPURenderer;

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game')?.appendChild(this.renderer.domElement);

    this.scene.add(this.cameraSystem.camera);

    this.scene.background = createSkybox();
    this.sceneEntities = {
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
      bitMask => bitMask === componentIds.mesh || bitMask === componentIds.instancedMesh
    );

    if (meshComponentIndex === undefined) {
      throw new Error(`meshComponent not found`);
    }
    this.sceneEntities.addMesh(params.entityArray[meshComponentIndex + 3]);
  }

  runSystems() {
    {
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

      //
      // this.storage.applyTickToEntitiesByComponentIds({
      // now,
      // timeElapsed,
      // componentIds: this.cubeSnackSystem.requiredComponents,
      // system: this.cubeSnackSystem,
      // });
      //
      //
    }
  }

  renderSceneSystem() {
    this.sceneEntities.meshToAdd.forEach(mesh => {
      console.log();

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

      return;
    });

    this.sceneEntities.meshToAdd.length = 0;
    this.sceneEntities.meshToDelete.length = 0;
  }
}
