import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshPhongMaterial,
  Plane,
  Quaternion,
  Vector3,
} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {BufferAttribute, Object3D} from 'three';

const keyColors = [
  new Color(0xff0000), // Red
  new Color(0xff7f00), // Orange
  new Color(0xffff00), // Yellow
  new Color(0x00ff00), // Green
  new Color(0x00ffff), // Cyan
  new Color(0x0000ff), // Blue
  new Color(0x8b00ff), // Violet
];

keyColors.push(keyColors.at(-1)!);

export type MeshGroup = Omit<Group, 'children'> & {
  children: (Omit<Mesh, 'material'> & {
    material: MeshPhongMaterial;
  })[];
};

const DEFAULT_VOXEL_SIZE = 0.5;

type VoxelMeshElement = {
  position: Vector3;
  color?: Color;
  occupied: boolean;
};

//TODO: Add Colors for Textures instead of rainbow colors
export class GLTFToVoxels {
  private loader: GLTFLoader;
  private voxelSize: number;
  private voxelGrid: Map<string, VoxelMeshElement>;
  private bounds: {
    min: Vector3;
    max: Vector3;
  };
  private voxelGeometry: BoxGeometry;
  private voxelMaterial: MeshPhongMaterial;

  // Reusable containers
  private readonly containermatrix = new Matrix4();
  private readonly containeroffset = new Vector3();
  private readonly containerorientation = new Quaternion();
  private readonly containerscale = new Vector3();
  private readonly containervertex = new Vector3();
  private readonly containertriangle: Vector3[] = [new Vector3(), new Vector3(), new Vector3()];
  private readonly containertriangleBounds = {
    min: new Vector3(),
    max: new Vector3(),
  };
  private readonly containervoxelBounds = {
    min: new Vector3(),
    max: new Vector3(),
  };
  private readonly containerplane = new Plane();
  private readonly containerprojectedPoint = new Vector3();
  private readonly containerclosestPoint = new Vector3();
  private readonly containerv0 = new Vector3();
  private readonly containerv1 = new Vector3();
  private readonly containerv2 = new Vector3();
  private readonly containerline = new Vector3();
  private readonly containerlineVector = new Vector3();

  constructor(
    voxelSize: number = DEFAULT_VOXEL_SIZE,
    voxelGeometry: BoxGeometry = new BoxGeometry(voxelSize, voxelSize, voxelSize),
    voxelMaterial: MeshPhongMaterial = new MeshPhongMaterial({
      transparent: true,
      opacity: 0.8,
    })
  ) {
    this.loader = new GLTFLoader();
    this.voxelSize = voxelSize;
    this.voxelGrid = new Map();
    this.bounds = {
      min: new Vector3(Infinity, Infinity, Infinity),
      max: new Vector3(-Infinity, -Infinity, -Infinity),
    };

    this.voxelGeometry = voxelGeometry;
    this.voxelMaterial = voxelMaterial;
  }

  createInstancedMesh(voxelizedModelScene: MeshGroup, instancedScale: number = 1): InstancedMesh {
    const voxelsCount = voxelizedModelScene.children.length;
    const voxels = voxelizedModelScene.children;

    const instancedMesh = new InstancedMesh(this.voxelGeometry, this.voxelMaterial, voxelsCount);
    this.containerscale.set(instancedScale, instancedScale, instancedScale);

    for (let i = 0; i < voxelsCount; i++) {
      const {position, material} = voxels[i];
      const {x, y, z} = position;

      this.containeroffset.set(x, y, z).multiplyScalar(instancedScale);
      this.containermatrix.compose(
        this.containeroffset,
        this.containerorientation,
        this.containerscale
      );
      instancedMesh.setMatrixAt(i, this.containermatrix);
      instancedMesh.setColorAt(i, material.color);
    }

    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    return instancedMesh;
  }

  private calculateBounds(object: Object3D): void {
    object.updateMatrixWorld(true);

    if (object instanceof Mesh) {
      const {geometry} = object;
      const positionAttribute = geometry.getAttribute('position');
      const matrix = object.matrixWorld;

      for (let i = 0; i < positionAttribute.count; i++) {
        this.containervertex.fromBufferAttribute(positionAttribute, i);
        this.containervertex.applyMatrix4(matrix);

        this.bounds.min.min(this.containervertex);
        this.bounds.max.max(this.containervertex);
      }
    }

    object.children.forEach(child => this.calculateBounds(child));
  }

  private getTriangleVertices(
    positionAttribute: BufferAttribute,
    indices: BufferAttribute,
    startIndex: number,
    matrix: Matrix4
  ): Vector3[] {
    for (let i = 0; i < 3; i++) {
      this.containervertex.fromBufferAttribute(positionAttribute, indices.getX(startIndex + i));
      this.containervertex.applyMatrix4(matrix);
      this.containertriangle[i].copy(this.containervertex);
    }

    return this.containertriangle;
  }

  private voxelizeTriangle(triangle: Vector3[]): void {
    this.containertriangleBounds.min.copy(triangle[0]).min(triangle[1]).min(triangle[2]);
    this.containertriangleBounds.max.copy(triangle[0]).max(triangle[1]).max(triangle[2]);

    const minVoxel = this.worldToVoxel(this.containertriangleBounds.min);
    const maxVoxel = this.worldToVoxel(this.containertriangleBounds.max);

    for (let {x} = minVoxel; x <= maxVoxel.x; x++) {
      for (let {y} = minVoxel; y <= maxVoxel.y; y++) {
        for (let {z} = minVoxel; z <= maxVoxel.z; z++) {
          const voxelCenter = this.voxelToWorld(this.containervertex.set(x, y, z));
          const voxelKey = `${x},${y},${z}`;

          if (this.voxelIntersectsTriangle(voxelCenter, triangle)) {
            const colorIndex = Math.floor(Math.abs(voxelCenter.z) % keyColors.length);

            this.voxelGrid.set(voxelKey, {
              position: voxelCenter.clone(), // We need to clone here as the position needs to persist
              color: keyColors[colorIndex],
              occupied: true,
            });
          }
        }
      }
    }
  }

  private voxelIntersectsTriangle(voxelCenter: Vector3, triangle: Vector3[]): boolean {
    const halfSize = this.voxelSize * 0.5;

    this.containervoxelBounds.min.copy(voxelCenter).subScalar(halfSize);
    this.containervoxelBounds.max.copy(voxelCenter).addScalar(halfSize);

    this.containertriangleBounds.min.copy(triangle[0]).min(triangle[1]).min(triangle[2]);
    this.containertriangleBounds.max.copy(triangle[0]).max(triangle[1]).max(triangle[2]);

    if (!this.boundingBoxesIntersect(this.containervoxelBounds, this.containertriangleBounds)) {
      return false;
    }

    const closestPoint = this.closestPointOnTriangle(voxelCenter, triangle);

    return voxelCenter.distanceTo(closestPoint) <= this.voxelSize * 0.7;
  }

  private closestPointOnTriangle(point: Vector3, triangle: Vector3[]): Vector3 {
    this.containerplane.setFromCoplanarPoints(triangle[0], triangle[1], triangle[2]);
    this.containerplane.projectPoint(point, this.containerprojectedPoint);

    if (this.pointInTriangle(this.containerprojectedPoint, triangle)) {
      return this.containerprojectedPoint;
    }

    let minDist = Infinity;

    for (let i = 0; i < 3; i++) {
      const lineStart = triangle[i];
      const lineEnd = triangle[(i + 1) % 3];
      this.closestPointOnLine(point, lineStart, lineEnd, this.containerclosestPoint);
      const dist = point.distanceTo(this.containerclosestPoint);

      if (dist < minDist) {
        minDist = dist;
        this.containerprojectedPoint.copy(this.containerclosestPoint);
      }
    }

    return this.containerprojectedPoint;
  }

  private pointInTriangle(point: Vector3, triangle: Vector3[]): boolean {
    this.containerv0.subVectors(triangle[2], triangle[0]);
    this.containerv1.subVectors(triangle[1], triangle[0]);
    this.containerv2.subVectors(point, triangle[0]);

    const dot00 = this.containerv0.dot(this.containerv0);
    const dot01 = this.containerv0.dot(this.containerv1);
    const dot02 = this.containerv0.dot(this.containerv2);
    const dot11 = this.containerv1.dot(this.containerv1);
    const dot12 = this.containerv1.dot(this.containerv2);

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return u >= 0 && v >= 0 && u + v <= 1;
  }

  private closestPointOnLine(
    point: Vector3,
    lineStart: Vector3,
    lineEnd: Vector3,
    target: Vector3
  ): Vector3 {
    this.containerline.subVectors(lineEnd, lineStart);
    const len = this.containerline.length();
    this.containerline.normalize();

    this.containerlineVector.subVectors(point, lineStart);
    const d = this.containerlineVector.dot(this.containerline);

    if (d <= 0) {
      return target.copy(lineStart);
    }

    if (d >= len) {
      return target.copy(lineEnd);
    }

    return target.copy(this.containerline).multiplyScalar(d).add(lineStart);
  }

  loadModel(
    url: string,
    scale: number,
    rotate?: {
      x: number;
      y: number;
      z: number;
    }
  ): Promise<{
    bounds: {
      min: Vector3;
      max: Vector3;
    };
    center: Vector3;
    centerOfGravity: Vector3;
    voxels: VoxelMeshElement[];
    mesh: MeshGroup;
  }> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        gltf => {
          this.voxelGrid.clear();

          gltf.scene.scale.set(scale, scale, scale);

          if (rotate) {
            gltf.scene.rotateX(rotate.x);
            gltf.scene.rotateY(rotate.y);
            gltf.scene.rotateZ(rotate.z);
          }

          // First pass: calculate bounds
          this.calculateBounds(gltf.scene);
          // Second pass: voxelize
          this.voxelizeModel(gltf.scene);
          resolve(this.createVoxelMesh());
        },
        undefined,
        reject
      );
    });
  }

  voxelizeModel(object: Object3D): void {
    object.updateMatrixWorld(true);

    if (object instanceof Mesh) {
      const {geometry} = object;
      const positionAttribute = geometry.getAttribute('position');
      const indices = geometry.getIndex()! as BufferAttribute;

      for (let i = 0; i < indices.count; i += 3) {
        const triangle = this.getTriangleVertices(
          positionAttribute,
          indices!,
          i,
          object.matrixWorld
        );

        this.voxelizeTriangle(triangle);
      }
    }

    object.children.forEach(child => this.voxelizeModel(child));
  }

  private worldToVoxel(position: Vector3): Vector3 {
    return new Vector3(
      Math.floor(position.x / this.voxelSize),
      Math.floor(position.y / this.voxelSize),
      Math.floor(position.z / this.voxelSize)
    );
  }

  private voxelToWorld(voxelPos: Vector3): Vector3 {
    return new Vector3(
      (voxelPos.x + 0.5) * this.voxelSize,
      (voxelPos.y + 0.5) * this.voxelSize,
      (voxelPos.z + 0.5) * this.voxelSize
    );
  }

  private boundingBoxesIntersect(
    box1: {min: Vector3; max: Vector3},
    box2: {min: Vector3; max: Vector3}
  ): boolean {
    return (
      box1.min.x <= box2.max.x &&
      box1.max.x >= box2.min.x &&
      box1.min.y <= box2.max.y &&
      box1.max.y >= box2.min.y &&
      box1.min.z <= box2.max.z &&
      box1.max.z >= box2.min.z
    );
  }

  //TODO: Implement color interpolation
  getInterpolatedColor(
    colorAttribute: BufferAttribute,
    triangle: Vector3[],
    point: Vector3,
    i1: number,
    i2: number,
    i3: number
  ): Color {
    // Get the barycentric coordinates of the point relative to the triangle
    const barycentric = this.getBarycentricCoordinates(point, triangle);

    const c1 = new Color();
    const c2 = new Color();
    const c3 = new Color();

    c1.fromBufferAttribute(colorAttribute, i1);
    c2.fromBufferAttribute(colorAttribute, i2);
    c3.fromBufferAttribute(colorAttribute, i3);

    const r = c1.r * barycentric.x + c2.r * barycentric.y + c3.r * barycentric.z;
    const g = c1.g * barycentric.x + c2.g * barycentric.y + c3.g * barycentric.z;
    const b = c1.b * barycentric.x + c2.b * barycentric.y + c3.b * barycentric.z;

    return new Color(r, g, b);
  }

  private getBarycentricCoordinates(point: Vector3, triangle: Vector3[]): Vector3 {
    const v0 = new Vector3().subVectors(triangle[1], triangle[0]);
    const v1 = new Vector3().subVectors(triangle[2], triangle[0]);
    const v2 = new Vector3().subVectors(point, triangle[0]);

    const d00 = v0.dot(v0);
    const d01 = v0.dot(v1);
    const d11 = v1.dot(v1);
    const d20 = v2.dot(v0);
    const d21 = v2.dot(v1);

    const denom = d00 * d11 - d01 * d01;
    const v = (d11 * d20 - d01 * d21) / denom;
    const w = (d00 * d21 - d01 * d20) / denom;
    const u = 1.0 - v - w;

    return new Vector3(u, v, w);
  }

  createVoxelMesh(): {
    bounds: {
      min: Vector3;
      max: Vector3;
    };
    center: Vector3;
    centerOfGravity: Vector3;
    voxels: VoxelMeshElement[];
    mesh: MeshGroup;
  } {
    const group = new Group();
    const boxGeometry = new BoxGeometry(this.voxelSize, this.voxelSize, this.voxelSize);

    const centerOfGravity = new Vector3();
    let totalWeight = 0;

    this.voxelGrid.forEach(voxel => {
      if (!voxel.occupied) {
        return;
      }

      const weight = 1;

      centerOfGravity.add(voxel.position.clone().multiplyScalar(weight));
      totalWeight += weight;

      const material = new MeshPhongMaterial({
        color: voxel.color || new Color(0x808080),
      });
      const mesh = new Mesh(boxGeometry, material);
      mesh.position.copy(voxel.position);
      group.add(mesh);
    });

    if (totalWeight > 0) {
      centerOfGravity.divideScalar(totalWeight);
    }

    return {
      bounds: this.bounds,
      centerOfGravity,
      center: this.bounds.min.clone().add(this.bounds.max).multiplyScalar(0.5),
      voxels: Array.from(this.voxelGrid.values()),
      mesh: group as MeshGroup,
    };
  }
}
