import {Matrix3, Matrix4, Vector3} from 'three';

type XYZ = [number, number, number];

export class OrientedBoundingBox {
  private translationVec3: Vector3;
  public readonly centerVec3: Vector3;
  public readonly rotationMat3Columns: [Vector3, Vector3, Vector3];
  public readonly halfExtents: XYZ;

  private frameRotationMatrix: [XYZ, XYZ, XYZ];
  private frameAbsRotationMatrix: [XYZ, XYZ, XYZ];
  private frameCoordinate: XYZ;

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

  intersects(otherOBB: OrientedBoundingBox) {
    const frameRotationMatrix = this.frameRotationMatrix;
    const frameAbsRotationMatrix = this.frameAbsRotationMatrix;
    const frameCoordinate = this.frameCoordinate;

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

    // Compute common subexpressions
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        frameAbsRotationMatrix[i][j] = Math.abs(frameRotationMatrix[i][j]) + Number.EPSILON; // Add epsilon to handle floating-point inaccuracies
      }
    }

    let halfExtentsProjection: number;
    let otherHalfExtentsProjection: number;
    let sumOfThisAndOtherHalfExtents: number;

    // Check three frames - dot products of column vectors of THIS OBB and OTHER OBB
    for (let i = 0; i < 3; i++) {
      halfExtentsProjection = this.halfExtents[i];
      otherHalfExtentsProjection =
        otherOBB.halfExtents[0] * frameAbsRotationMatrix[i][0] +
        otherOBB.halfExtents[1] * frameAbsRotationMatrix[i][1] +
        otherOBB.halfExtents[2] * frameAbsRotationMatrix[i][2];

      sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

      if (Math.abs(frameCoordinate[i]) > sumOfThisAndOtherHalfExtents) {
        return false;
      }
    }

    // Check three frames - dot products of column vectors of OTHER OBB and THIS OBB
    for (let i = 0; i < 3; i++) {
      halfExtentsProjection =
        this.halfExtents[0] * frameAbsRotationMatrix[0][i] +
        this.halfExtents[1] * frameAbsRotationMatrix[1][i] +
        this.halfExtents[2] * frameAbsRotationMatrix[2][i];
      otherHalfExtentsProjection = otherOBB.halfExtents[i];

      sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

      if (
        Math.abs(
          frameCoordinate[0] * frameRotationMatrix[0][i] +
            frameCoordinate[1] * frameRotationMatrix[1][i] +
            frameCoordinate[2] * frameRotationMatrix[2][i]
        ) > sumOfThisAndOtherHalfExtents
      ) {
        return false;
      }
    }

    halfExtentsProjection =
      this.halfExtents[1] * frameAbsRotationMatrix[2][0] +
      this.halfExtents[2] * frameAbsRotationMatrix[1][0];
    otherHalfExtentsProjection =
      otherOBB.halfExtents[1] * frameAbsRotationMatrix[0][2] +
      otherOBB.halfExtents[2] * frameAbsRotationMatrix[0][1];

    sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

    // Check nine frames - edge cross-products is bigger than sum of half extents
    if (
      Math.abs(
        frameCoordinate[2] * frameRotationMatrix[1][0] -
          frameCoordinate[1] * frameRotationMatrix[2][0]
      ) > sumOfThisAndOtherHalfExtents
    ) {
      return false;
    }

    halfExtentsProjection =
      this.halfExtents[1] * frameAbsRotationMatrix[2][1] +
      this.halfExtents[2] * frameAbsRotationMatrix[1][1];
    otherHalfExtentsProjection =
      otherOBB.halfExtents[0] * frameAbsRotationMatrix[0][2] +
      otherOBB.halfExtents[2] * frameAbsRotationMatrix[0][0];

    sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

    if (
      Math.abs(
        frameCoordinate[2] * frameRotationMatrix[1][1] -
          frameCoordinate[1] * frameRotationMatrix[2][1]
      ) > sumOfThisAndOtherHalfExtents
    ) {
      return false;
    }

    halfExtentsProjection =
      this.halfExtents[1] * frameAbsRotationMatrix[2][2] +
      this.halfExtents[2] * frameAbsRotationMatrix[1][2];
    otherHalfExtentsProjection =
      otherOBB.halfExtents[0] * frameAbsRotationMatrix[0][1] +
      otherOBB.halfExtents[1] * frameAbsRotationMatrix[0][0];

    sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

    if (
      Math.abs(
        frameCoordinate[2] * frameRotationMatrix[1][2] -
          frameCoordinate[1] * frameRotationMatrix[2][2]
      ) > sumOfThisAndOtherHalfExtents
    ) {
      return false;
    }

    halfExtentsProjection =
      this.halfExtents[0] * frameAbsRotationMatrix[2][0] +
      this.halfExtents[2] * frameAbsRotationMatrix[0][0];
    otherHalfExtentsProjection =
      otherOBB.halfExtents[1] * frameAbsRotationMatrix[1][2] +
      otherOBB.halfExtents[2] * frameAbsRotationMatrix[1][1];

    sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

    if (
      Math.abs(
        frameCoordinate[0] * frameRotationMatrix[2][0] -
          frameCoordinate[2] * frameRotationMatrix[0][0]
      ) > sumOfThisAndOtherHalfExtents
    ) {
      return false;
    }

    halfExtentsProjection =
      this.halfExtents[0] * frameAbsRotationMatrix[2][1] +
      this.halfExtents[2] * frameAbsRotationMatrix[0][1];
    otherHalfExtentsProjection =
      otherOBB.halfExtents[0] * frameAbsRotationMatrix[1][2] +
      otherOBB.halfExtents[2] * frameAbsRotationMatrix[1][0];

    sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

    if (
      Math.abs(
        frameCoordinate[0] * frameRotationMatrix[2][1] -
          frameCoordinate[2] * frameRotationMatrix[0][1]
      ) > sumOfThisAndOtherHalfExtents
    ) {
      return false;
    }

    halfExtentsProjection =
      this.halfExtents[0] * frameAbsRotationMatrix[2][2] +
      this.halfExtents[2] * frameAbsRotationMatrix[0][2];
    otherHalfExtentsProjection =
      otherOBB.halfExtents[0] * frameAbsRotationMatrix[1][1] +
      otherOBB.halfExtents[1] * frameAbsRotationMatrix[1][0];

    sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

    if (
      Math.abs(
        frameCoordinate[0] * frameRotationMatrix[2][2] -
          frameCoordinate[2] * frameRotationMatrix[0][2]
      ) > sumOfThisAndOtherHalfExtents
    ) {
      return false;
    }

    halfExtentsProjection =
      this.halfExtents[0] * frameAbsRotationMatrix[1][0] +
      this.halfExtents[1] * frameAbsRotationMatrix[0][0];
    otherHalfExtentsProjection =
      otherOBB.halfExtents[1] * frameAbsRotationMatrix[2][2] +
      otherOBB.halfExtents[2] * frameAbsRotationMatrix[2][1];

    sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

    if (
      Math.abs(
        frameCoordinate[1] * frameRotationMatrix[0][0] -
          frameCoordinate[0] * frameRotationMatrix[1][0]
      ) > sumOfThisAndOtherHalfExtents
    ) {
      return false;
    }

    halfExtentsProjection =
      this.halfExtents[0] * frameAbsRotationMatrix[1][1] +
      this.halfExtents[1] * frameAbsRotationMatrix[0][1];
    otherHalfExtentsProjection =
      otherOBB.halfExtents[0] * frameAbsRotationMatrix[2][2] +
      otherOBB.halfExtents[2] * frameAbsRotationMatrix[2][0];

    sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

    if (
      Math.abs(
        frameCoordinate[1] * frameRotationMatrix[0][1] -
          frameCoordinate[0] * frameRotationMatrix[1][1]
      ) > sumOfThisAndOtherHalfExtents
    ) {
      return false;
    }

    halfExtentsProjection =
      this.halfExtents[0] * frameAbsRotationMatrix[1][2] +
      this.halfExtents[1] * frameAbsRotationMatrix[0][2];
    otherHalfExtentsProjection =
      otherOBB.halfExtents[0] * frameAbsRotationMatrix[2][1] +
      otherOBB.halfExtents[1] * frameAbsRotationMatrix[2][0];

    sumOfThisAndOtherHalfExtents = halfExtentsProjection + otherHalfExtentsProjection;

    if (
      Math.abs(
        frameCoordinate[1] * frameRotationMatrix[0][2] -
          frameCoordinate[0] * frameRotationMatrix[1][2]
      ) > sumOfThisAndOtherHalfExtents
    ) {
      return false;
    }

    return true;
  }
}
