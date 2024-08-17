import {
  AmbientLight,
  AxesHelper,
  ConeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
} from 'three';
import Stats from 'stats.js';
import {Scene, WebGLRenderer} from 'three';
import type {WebGPURenderer} from '../helpers';
import type {Component} from '../components';
import type {EntityArray} from './storage.ts';
import {createSkybox} from '../helpers';
import {bitMasks} from '../components';
import {CameraSystem} from '../systems';
import {SpatialHashGrid} from '../helpers/grid.ts';
import {World} from './base.ts';

export class ClientWorld extends World {
  renderSystemUpdateId = -1;
  renderer: WebGPURenderer | WebGLRenderer;

  stats = new Stats();
  scene = new Scene();
  camera: PerspectiveCamera;
  sceneEntities: {
    updateId: [0];
    meshToAdd: Component['data'][];
    meshToDelete: Component['data'][];
    addMesh: (mesh: Component['data']) => void;
    deleteMesh: (mesh: Component['data']) => void;
  };

  cameraSystem: CameraSystem;
  debugCamera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

  grid = new SpatialHashGrid();

  constructor() {
    super();

    const FOV = 100;
    const ASPECT = window.innerWidth / window.innerHeight;
    const NEAR = 0.2;
    const FAR = 3000;

    this.camera = new PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
    this.renderer = new WebGLRenderer();

    const sphereGeometry = new ConeGeometry(5, 10, 25);
    const sphereMaterial = new MeshBasicMaterial({color: 0xff0000});
    const sphereMesh = new Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.rotation.x = Math.PI / 2;

    const cameraAxisHelper = new AxesHelper(-10);

    this.camera.add(cameraAxisHelper);
    this.camera.add(sphereMesh);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    //TODO: FIX THIS SHIT
    this.cameraSystem = new CameraSystem(this.camera);

    this.debugCamera.position.set(80, 80, 70);
    this.debugCamera.lookAt(0, 0, 0);
    this.scene.add(this.camera);

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
      this.renderer.render(this.scene, this.camera);
      previousRAF = t;
      this.stats.end();

      setTimeout(() => {
        this.requestAnimationFrameWithElapsedTime(previousRAFFixedUpdate, acc, previousRAF);
      }, 1);
    });
  };

  createEntityAndAddToScene(params: {
    componentsBitMask: number;
    entityArray: EntityArray;
    sortedBitMasks: number[];
  }) {
    this.storage.createEntity(params);
    const meshComponentIndex = params.sortedBitMasks.findIndex(
      bitMask => bitMask === bitMasks.mesh || bitMask === bitMasks.instancedMesh
    );

    if (meshComponentIndex === undefined) {
      throw new Error(`meshComponent not found`);
    }
    this.sceneEntities.addMesh(params.entityArray[meshComponentIndex + 3]);
  }

  runSystems(timeElapsed: number) {
    {
      const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

      if (this.renderSystemUpdateId !== this.sceneEntities.updateId[0]) {
        this.renderSystemUpdateId = this.sceneEntities.updateId[0];
        this.renderSceneSystem();
      }

      this.movementsSystemRunner.update({
        timeElapsedS,
        grid: this.grid,
        archetypePartition: this.storage.getArchetypePartitionByStrictComponentsMask(
          this.movementsSystemRunner.requiredComponents
        ),
      });
      this.cameraSystem.update({
        timeElapsedS,
      });
    }
  }

  renderSceneSystem() {
    this.sceneEntities.meshToAdd.forEach(mesh => {
      if (mesh instanceof Mesh || mesh instanceof Group) {
        this.scene.add(mesh);
        this.grid.insert(mesh);

        return;
      }

      throw new Error(`RenderSceneSystem-meshToAdd: mesh is not instance of Mesh`);
    });

    this.sceneEntities.meshToDelete.forEach(mesh => {
      this.scene.remove(mesh as Mesh | Group);

      return;
    });

    this.sceneEntities.meshToAdd.length = 0;
    this.sceneEntities.meshToDelete.length = 0;
  }
}
