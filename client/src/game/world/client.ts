import {
  BoxGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from 'three';
import type {WebGPURenderer} from '../helpers';
import type {InstancedMesh, Scene, WebGLRenderer} from 'three';
import type {Component} from '../components';
import type {EntityArray} from './base.ts';
import {createSkybox} from '../helpers';
import {bitMasks} from '../components';
import {CameraSystem} from '../systems';
import {stats} from '../window.ts';
import {SpatialHashGrid} from '../helpers/grid.ts';
import {World} from './base.ts';
import {partitionConstants} from './base.ts';

export class ClientWorld extends World {
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

  cameraSystem: CameraSystem;
  debugCamera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

  grid = new SpatialHashGrid();

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
    this.cameraSystem = new CameraSystem(this);

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

    //debug

    const boxGeometry = new BoxGeometry(10, 10, 10);
    boxGeometry.translate(5, 0, 5);
    const boxMaterial = new MeshBasicMaterial({color: 0x00ff00, wireframe: true});
    const boxMesh = new Mesh(boxGeometry, boxMaterial);

    scene.add(boxMesh);
    this.grid.insert(boxMesh);
  }

  hz50 = 0.02;

  requestAnimationFrameWithElapsedTime = (
    previousRAFFixedUpdate: number = 0,
    acc = 0,
    previousRAF: number = 0
  ) => {
    requestAnimationFrame(t => {
      stats.begin();
      //Fixed update
      //
      // const timeElapsed = t - previousRAFFixedUpdate;
      // previousRAFFixedUpdate += timeElapsed;
      // acc += timeElapsed;
      // while (acc >= this.hz50) {
      // acc -= this.hz50;
      // }
      //
      //
      //

      //Frame rate independent update (delta time)
      this.runSystems(t - previousRAF);
      this.renderer.render(this.scene, this.camera);
      previousRAF = t;
      //
      stats.end();

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
    this.createEntity(params);
    const meshComponentIndex = params.sortedBitMasks.findIndex(
      bitMask => bitMask === bitMasks.mesh || bitMask === bitMasks.instancedMesh
    );

    if (meshComponentIndex === undefined) {
      throw new Error(`meshComponent not found`);
    }
    this.sceneEntities.addMesh(params.entityArray[meshComponentIndex + 3]);
  }

  runSystemsFixedUpdate(timeElapsed: number) {
    {
      const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

      if (this.renderSystemUpdateId !== this.sceneEntities.updateId[0]) {
        this.renderSceneSystem();
        this.renderSystemUpdateId = this.sceneEntities.updateId[0];
      }

      this.movementsSystemRunner.update({
        timeElapsedS,
        grid: this.grid,
        archetypePartition: this.getArchetypePartitionByStrictComponentsMask(
          this.movementsSystemRunner.requiredComponents
        ),
      });
      this.cameraSystem.update({timeElapsedS});
      this.particlesSnackLoopSystem(timeElapsedS);
    }
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
        archetypePartition: this.getArchetypePartitionByStrictComponentsMask(
          this.movementsSystemRunner.requiredComponents
        ),
      });
      this.cameraSystem.update({
        timeElapsedS,
      });
      //this.particlesSnackLoopSystem(timeElapsedS);
    }
  }

  particlesSnackLoopSystem(timeElapsedS: number) {
    const archetypePartition = this.getArchetypePartitionByStrictComponentsMask([
      bitMasks.instancedMesh,
    ]);

    if (archetypePartition === undefined) {
      return;
    }

    const lastEntityIndex = archetypePartition[0];
    const componentIndexes = archetypePartition[1];
    const entityLength = archetypePartition[2];

    const instanceMatrixIndex = componentIndexes[bitMasks.instancedMesh];

    const dummyMatrix4 = new Matrix4();
    const dummyQuaternion = new Quaternion();
    const dummyPosition = new Vector3();
    const dummyScale = new Vector3();

    const dummyTwoMatrix4 = new Matrix4();
    const dummyTwoQuaternion = new Quaternion();
    const dummyTwoPosition = new Vector3();
    const dummyTwoScale = new Vector3(0, 0, 0);

    const multiplier = 10;

    for (let i = partitionConstants.entityLengthOffset; i < lastEntityIndex; i += entityLength) {
      const instancedMesh = archetypePartition[i + instanceMatrixIndex] as InstancedMesh;

      for (let j = 0; j < instancedMesh.count - 1; j++) {
        instancedMesh.getMatrixAt(j, dummyMatrix4);
        dummyMatrix4.decompose(dummyPosition, dummyQuaternion, dummyScale);

        instancedMesh.getMatrixAt(j + 1, dummyTwoMatrix4);
        dummyTwoMatrix4.decompose(dummyTwoPosition, dummyTwoQuaternion, dummyTwoScale);

        instancedMesh.setMatrixAt(
          j,
          dummyMatrix4.compose(
            dummyPosition.lerp(dummyTwoPosition, timeElapsedS * multiplier),
            dummyQuaternion.slerp(dummyTwoQuaternion, timeElapsedS * multiplier),
            dummyScale.lerp(dummyTwoScale, timeElapsedS * multiplier)
          )
        );
      }

      instancedMesh.getMatrixAt(instancedMesh.count - 1, dummyMatrix4);
      dummyMatrix4.decompose(dummyPosition, dummyQuaternion, dummyScale);

      instancedMesh.getMatrixAt(0, dummyTwoMatrix4);
      dummyTwoMatrix4.decompose(dummyTwoPosition, dummyTwoQuaternion, dummyTwoScale);

      instancedMesh.setMatrixAt(
        instancedMesh.count - 1,
        dummyMatrix4.compose(
          dummyPosition.lerpVectors(dummyPosition, dummyTwoPosition, timeElapsedS * multiplier),
          dummyQuaternion.slerp(dummyTwoQuaternion, timeElapsedS * multiplier),
          dummyScale.lerpVectors(dummyScale, dummyTwoScale, timeElapsedS * multiplier)
        )
      );

      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  renderSceneSystem() {
    this.sceneEntities.meshToAdd.forEach(mesh => {
      if (mesh instanceof Mesh || mesh instanceof Group) {
        this.scene.add(mesh);
        this.grid.insert(mesh);
        console.log(this.grid);

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
