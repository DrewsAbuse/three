import {AmbientLight, Group, InstancedMesh, Mesh, Object3D, PerspectiveCamera} from 'three';
import Stats from 'stats.js';
import {Scene, WebGLRenderer} from 'three';
import type {WebGPURenderer} from '../helpers';
import type {Component} from '../components';
import type {EntityArray} from '../types.ts';
import {componentsId} from '../components';
import {createSkybox} from '../helpers';
import {CameraSystem} from '../systems';
import {SpatialHashGrid} from '../helpers/grid.ts';
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

  cameraSystem = new CameraSystem();
  debugCamera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

  grid = new SpatialHashGrid();

  constructor() {
    super();

    this.renderer = new WebGLRenderer();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.debugCamera.position.set(80, 80, 70);
    this.debugCamera.lookAt(0, 0, 0);
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

  hz50 = 0.02;

  requestAnimationFrameWithElapsedTime = (
    previousRAFFixedUpdate: number = 0,
    acc = 0,
    previousRAF: number = 0
  ) => {
    requestAnimationFrame(t => {
      this.stats.begin();
      this.runSystems(t - previousRAF);
      this.renderer.render(this.scene, this.cameraSystem.camera);
      previousRAF = t;
      this.stats.end();

      setTimeout(() => {
        this.requestAnimationFrameWithElapsedTime(previousRAFFixedUpdate, acc, previousRAF);
      }, 1);
    });
  };

  createEntityAndAddToScene(params: {entityArray: EntityArray; componentsId: Uint16Array}) {
    this.storage.insertEntities({
      entities: [params.entityArray],
      componentsId: params.componentsId,
    });
    const meshComponentIndex = params.componentsId.findIndex(
      bitMask => bitMask === componentsId.mesh || bitMask === componentsId.instancedMesh
    );

    if (meshComponentIndex === undefined) {
      throw new Error(`meshComponent not found`);
    }
    this.sceneEntities.addMesh(params.entityArray[meshComponentIndex + 3]);
  }

  runSystems(prevTimeElapsed: number) {
    {
      const timeElapsed = Math.min(1.0 / 30.0, prevTimeElapsed * 0.001);
      const now = new Date().getTime();

      if (this.renderSystemUpdateId !== this.sceneEntities.updateId[0]) {
        this.renderSystemUpdateId = this.sceneEntities.updateId[0];
        this.renderSceneSystem();
      }

      this.storage.applyTickToEntitiesByComponentIds({
        now,
        timeElapsed,
        componentIds: this.movementsSystemRunner.requiredComponents,
        system: this.movementsSystemRunner,
      });
      this.storage.applyTickToEntitiesByComponentIds({
        now,
        timeElapsed,
        componentIds: this.cameraSystem.requiredComponents,
        system: this.cameraSystem,
      });
      this.storage.applyTickToEntitiesByComponentIds({
        now,
        timeElapsed,
        componentIds: this.cubeSnackSystem.requiredComponents,
        system: this.cubeSnackSystem,
      });
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
