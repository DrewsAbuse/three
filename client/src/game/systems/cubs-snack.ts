import {Matrix4, Quaternion, Vector3} from 'three';
import type {InstancedMesh} from 'three';
import type {TickParams} from '../types';
import {componentIds} from '../components';
import {System} from './base.ts';

export class CubeSnackSystem extends System {
  constructor() {
    super({
      requiredComponents: new Uint16Array([componentIds.instancedMesh]),
    });
  }

  private dummyMatrix4 = new Matrix4();
  private dummyQuaternion = new Quaternion();
  private dummyPosition = new Vector3();
  private dummyScale = new Vector3();

  private dummyTwoMatrix4 = new Matrix4();
  private dummyTwoQuaternion = new Quaternion();
  private dummyTwoPosition = new Vector3();
  private dummyTwoScale = new Vector3(0, 0, 0);

  updateTick({systemStep, partition, index, idToComponentOffset}: TickParams) {
    const multiplier = 10;

    this.dummyMatrix4.multiplyScalar(0);
    this.dummyQuaternion.set(0, 0, 0, 1);
    this.dummyPosition.set(0, 0, 0);
    this.dummyScale.set(0, 0, 0);

    this.dummyTwoMatrix4.multiplyScalar(0);
    this.dummyTwoQuaternion.set(0, 0, 0, 1);
    this.dummyTwoPosition.set(0, 0, 0);
    this.dummyTwoScale.set(0, 0, 0);

    const instancedMesh = partition[
      index + idToComponentOffset[componentIds.instancedMesh]
    ] as InstancedMesh;

    for (let j = 0; j < instancedMesh.count - 1; j++) {
      instancedMesh.getMatrixAt(j, this.dummyMatrix4);
      this.dummyMatrix4.decompose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);

      instancedMesh.getMatrixAt(j + 1, this.dummyTwoMatrix4);
      this.dummyTwoMatrix4.decompose(
        this.dummyTwoPosition,
        this.dummyTwoQuaternion,
        this.dummyTwoScale
      );

      instancedMesh.setMatrixAt(
        j,
        this.dummyMatrix4.compose(
          this.dummyPosition.lerp(this.dummyTwoPosition, systemStep * multiplier),
          this.dummyQuaternion.slerp(this.dummyTwoQuaternion, systemStep * multiplier),
          this.dummyScale.lerp(this.dummyTwoScale, systemStep * multiplier)
        )
      );
    }

    instancedMesh.getMatrixAt(instancedMesh.count - 1, this.dummyMatrix4);
    this.dummyMatrix4.decompose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);

    instancedMesh.getMatrixAt(0, this.dummyTwoMatrix4);
    this.dummyTwoMatrix4.decompose(
      this.dummyTwoPosition,
      this.dummyTwoQuaternion,
      this.dummyTwoScale
    );

    instancedMesh.setMatrixAt(
      instancedMesh.count - 1,
      this.dummyMatrix4.compose(
        this.dummyPosition.lerpVectors(
          this.dummyPosition,
          this.dummyTwoPosition,
          systemStep * multiplier
        ),
        this.dummyQuaternion.slerp(this.dummyTwoQuaternion, systemStep * multiplier),
        this.dummyScale.lerpVectors(this.dummyScale, this.dummyTwoScale, systemStep * multiplier)
      )
    );

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  }
}
