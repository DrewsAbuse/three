import {Matrix4, Vector3} from 'three';

type XYZ = [number, number, number];
type CollisionInfo = {
  intersected: boolean;
  penetrationDepth: number;
  separationAxis: Vector3;
};

export class OrientedBoundingBox {
  private readonly translationVec3: Vector3;
  public readonly centerVec3: Vector3;
  public readonly rotationMat3Columns: [Vector3, Vector3, Vector3];
  public readonly halfExtents: XYZ;

  private readonly frameRotationMatrix: [XYZ, XYZ, XYZ];
  private readonly frameAbsRotationMatrix: [XYZ, XYZ, XYZ];
  private readonly frameCoordinate: XYZ;
  private readonly tmpVector: Vector3;

  constructor() {
    this.translationVec3 = new Vector3();
    this.centerVec3 = new Vector3();
    this.rotationMat3Columns = [new Vector3(), new Vector3(), new Vector3()];
    this.halfExtents = [0, 0, 0];

    this.frameRotationMatrix = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    this.frameAbsRotationMatrix = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    this.frameCoordinate = [0, 0, 0];

    this.tmpVector = new Vector3();
  }

  public set(center: Vector3, halfExtents: Vector3, rotation: Matrix4): this {
    this.centerVec3.x = center.x;
    this.centerVec3.y = center.y;
    this.centerVec3.z = center.z;

    this.halfExtents[0] = halfExtents.x;
    this.halfExtents[1] = halfExtents.y;
    this.halfExtents[2] = halfExtents.z;

    // Matrix 4x4 to Matrix 3x3

    this.rotationMat3Columns[0].x = rotation.elements[0];
    this.rotationMat3Columns[0].y = rotation.elements[1];
    this.rotationMat3Columns[0].z = rotation.elements[2];

    this.rotationMat3Columns[1].x = rotation.elements[4];
    this.rotationMat3Columns[1].y = rotation.elements[5];
    this.rotationMat3Columns[1].z = rotation.elements[6];

    this.rotationMat3Columns[2].x = rotation.elements[8];
    this.rotationMat3Columns[2].y = rotation.elements[9];
    this.rotationMat3Columns[2].z = rotation.elements[10];

    return this;
  }

  intersects(otherOBB: OrientedBoundingBox): CollisionInfo {
    const frameRotationMatrix = this.frameRotationMatrix;
    const frameAbsRotationMatrix = this.frameAbsRotationMatrix;
    const frameCoordinate = this.frameCoordinate;

    let minPenetration = Number.POSITIVE_INFINITY;
    const bestAxis = new Vector3();

    // Set frame rotation matrix - dot products of column vectors of THIS OBB and OTHER OBB
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        frameRotationMatrix[i][j] = this.rotationMat3Columns[i].dot(
          otherOBB.rotationMat3Columns[j]
        );
      }
    }

    this.translationVec3.subVectors(otherOBB.centerVec3, this.centerVec3);
    frameCoordinate[0] = this.translationVec3.dot(this.rotationMat3Columns[0]);
    frameCoordinate[1] = this.translationVec3.dot(this.rotationMat3Columns[1]);
    frameCoordinate[2] = this.translationVec3.dot(this.rotationMat3Columns[2]);

    // Compute common subexpressions - absolute values of frame rotation matrix
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        frameAbsRotationMatrix[i][j] = Math.abs(frameRotationMatrix[i][j]) + Number.EPSILON;
      }
    }

    // Test axes from this OBB - dot products of column vectors of THIS OBB and frame rotation matrix
    for (let i = 0; i < 3; i++) {
      const halfExtentsProjection = this.halfExtents[i];
      const otherHalfExtentsProjection =
        otherOBB.halfExtents[0] * frameAbsRotationMatrix[i][0] +
        otherOBB.halfExtents[1] * frameAbsRotationMatrix[i][1] +
        otherOBB.halfExtents[2] * frameAbsRotationMatrix[i][2];

      const penetrationDepth =
        halfExtentsProjection + otherHalfExtentsProjection - Math.abs(frameCoordinate[i]);

      if (penetrationDepth < 0) {
        return {
          intersected: false,
          penetrationDepth: 0,
          separationAxis: new Vector3(),
        };
      }

      if (penetrationDepth < minPenetration) {
        minPenetration = penetrationDepth;
        bestAxis.copy(this.rotationMat3Columns[i]);
        if (frameCoordinate[i] > 0) {
          bestAxis.multiplyScalar(-1);
        }
      }
    }

    // Test axes from other OBB - dot products of column vectors of OTHER OBB and frame rotation matrix
    for (let i = 0; i < 3; i++) {
      const halfExtentsProjection =
        this.halfExtents[0] * frameAbsRotationMatrix[0][i] +
        this.halfExtents[1] * frameAbsRotationMatrix[1][i] +
        this.halfExtents[2] * frameAbsRotationMatrix[2][i];
      const otherHalfExtentsProjection = otherOBB.halfExtents[i];

      const separation =
        frameCoordinate[0] * frameRotationMatrix[0][i] +
        frameCoordinate[1] * frameRotationMatrix[1][i] +
        frameCoordinate[2] * frameRotationMatrix[2][i];

      const penetrationDepth =
        halfExtentsProjection + otherHalfExtentsProjection - Math.abs(separation);

      if (penetrationDepth < 0) {
        return {
          intersected: false,
          penetrationDepth: 0,
          separationAxis: new Vector3(),
        };
      }

      if (penetrationDepth < minPenetration) {
        minPenetration = penetrationDepth;
        bestAxis.copy(otherOBB.rotationMat3Columns[i]);
        if (separation > 0) {
          bestAxis.multiplyScalar(-1);
        }
      }
    }

    // Test cross products of pairs of axes (9 tests) - dot products of pairs of column vectors of THIS OBB and OTHER OBB
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        this.tmpVector.crossVectors(this.rotationMat3Columns[i], otherOBB.rotationMat3Columns[j]);

        if (this.tmpVector.lengthSq() < Number.EPSILON) {
          continue; // Skip parallel axes
        }

        this.tmpVector.normalize();

        // Project half-extents onto axis
        const thisProj =
          Math.abs(this.halfExtents[0] * this.tmpVector.dot(this.rotationMat3Columns[0])) +
          Math.abs(this.halfExtents[1] * this.tmpVector.dot(this.rotationMat3Columns[1])) +
          Math.abs(this.halfExtents[2] * this.tmpVector.dot(this.rotationMat3Columns[2]));

        const otherProj =
          Math.abs(otherOBB.halfExtents[0] * this.tmpVector.dot(otherOBB.rotationMat3Columns[0])) +
          Math.abs(otherOBB.halfExtents[1] * this.tmpVector.dot(otherOBB.rotationMat3Columns[1])) +
          Math.abs(otherOBB.halfExtents[2] * this.tmpVector.dot(otherOBB.rotationMat3Columns[2]));

        const separation = Math.abs(this.tmpVector.dot(this.translationVec3));
        const penetrationDepth = thisProj + otherProj - separation;

        if (penetrationDepth < 0) {
          return {
            intersected: false,
            penetrationDepth: 0,
            separationAxis: new Vector3(),
          };
        }

        if (penetrationDepth < minPenetration) {
          minPenetration = penetrationDepth;
          bestAxis.copy(this.tmpVector);
        }

        return {
          intersected: true,
          penetrationDepth: minPenetration,
          separationAxis: bestAxis,
        };
      }
    }

    return {
      intersected: true,
      penetrationDepth: minPenetration,
      separationAxis: bestAxis,
    };
  }
}
