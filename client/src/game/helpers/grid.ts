import {Matrix3, Vector3} from 'three';
import {OBB} from 'three/addons/math/OBB.js';
import type {Box3, Matrix4, Mesh} from 'three';
import {OrientedBoundingBox} from './obb.ts';

const CHUNK_BITS = 10;
const CHUNK_SIZE = 1 << CHUNK_BITS;

const ID_OFFSET = 0;
const X_OFFSET = 1;
const Y_OFFSET = 2;
const Z_OFFSET = 3;
const BOUND_X_OFFSET = 4;
const BOUND_Y_OFFSET = 5;
const BOUND_Z_OFFSET = 6;

const CHUNK_HEADER_SIZE = 1;
const CHUNK_MAX_ENTITIES = 64;

type Near = {
  entityId: number;
  halfSize: {
    x: number;
    y: number;
    z: number;
  };
  center: {
    x: number;
    y: number;
    z: number;
  };
  mesh?: Mesh;
};

export type MeshWithBoundingBox = Mesh & {
  geometry: Mesh['geometry'] & {
    boundingBox: Box3;
  };
};

export class Grid {
  private readonly cellSize: number;
  private readonly maxEntities: number;
  private entityCount = 0;

  private maxEntitiesPerCollision = 128;

  private readonly entityIds: Int32Array;

  // Optimized chunk storage - each chunk is a contiguous array
  private readonly chunkData: Int32Array;
  private readonly chunkMap: Map<string, number> = new Map(); // Changed to string key

  // Entity to chunk mapping
  private readonly entityChunks: string[]; // Changed to string array
  private readonly entityChunkCounts: Int32Array;

  // Reusable collision buffers
  private readonly collisions: Int32Array;

  private readonly entities: Near[];

  private readonly nearestEntities: Near[] = [];

  private centerContainer = new Vector3();
  private halfExtentsContainer = new Vector3();
  constructor(cellSize = 16, maxEntities = 500000) {
    if (cellSize < 0.001) {
      throw new Error('Cell size must be greater than 0.001');
    }

    this.cellSize = cellSize;
    this.maxEntities = maxEntities;

    const totalChunkSlots = maxEntities * 8;
    this.chunkData = new Int32Array(totalChunkSlots * (CHUNK_HEADER_SIZE + CHUNK_MAX_ENTITIES));

    this.entityChunks = new Array(maxEntities * 8); // Changed to regular array
    this.entityChunkCounts = new Int32Array(maxEntities);

    this.collisions = new Int32Array(this.maxEntitiesPerCollision);

    this.entities = new Array(this.maxEntities).fill({
      entityId: -1,
      size: {x: 0, y: 0, z: 0},
      center: {x: 0, y: 0, z: 0},
    });

    this.entityIds = new Int32Array(this.maxEntities);
  }

  private getChunkOffset(chunkKey: string): number {
    let chunkOffset = this.chunkMap.get(chunkKey);

    if (chunkOffset === undefined) {
      chunkOffset = this.allocateChunk();
      this.chunkMap.set(chunkKey, chunkOffset);
    }

    return chunkOffset;
  }

  private allocateChunk(): number {
    for (let i = 0; i < this.chunkData.length; i += CHUNK_MAX_ENTITIES + CHUNK_HEADER_SIZE) {
      if (this.chunkData[i] === 0) {
        return i;
      }
    }
    throw new Error('No more chunk slots available');
  }

  public computeChunkKey(x: number, y: number, z: number): string {
    const chunkX = Math.floor(x / (this.cellSize * CHUNK_SIZE));
    const chunkY = Math.floor(y / (this.cellSize * CHUNK_SIZE));
    const chunkZ = Math.floor(z / (this.cellSize * CHUNK_SIZE));

    return `${chunkX},${chunkY},${chunkZ}`;
  }

  addEntityMesh(
    id: number,
    mesh: MeshWithBoundingBox,
    centerX: number,
    centerY: number,
    centerZ: number,
    halfX: number,
    halfY: number,
    halfZ: number
  ): void {
    if (this.entityCount >= this.maxEntities) {
      throw new Error('Maximum entity count reached');
    }

    const entityDataIndex = this.entityCount;

    this.centerContainer.set(centerX, centerY, centerZ);
    this.halfExtentsContainer.set(halfX, halfY, halfZ);

    this.entities[entityDataIndex] = {
      entityId: id,
      halfSize: {
        x: this.halfExtentsContainer.x,
        y: this.halfExtentsContainer.y,
        z: this.halfExtentsContainer.z,
      },
      center: {
        x: this.centerContainer.x,
        y: this.centerContainer.y,
        z: this.centerContainer.z,
      },
      mesh,
    };
    this.entityIds[entityDataIndex] = id;

    const minX = this.centerContainer.x - this.halfExtentsContainer.x;
    const maxX = this.centerContainer.x + this.halfExtentsContainer.x;
    const minY = this.centerContainer.y - this.halfExtentsContainer.y;
    const maxY = this.centerContainer.y + this.halfExtentsContainer.y;
    const minZ = this.centerContainer.z - this.halfExtentsContainer.z;
    const maxZ = this.centerContainer.z + this.halfExtentsContainer.z;

    const minChunkX = Math.floor(minX / (this.cellSize * CHUNK_SIZE));
    const maxChunkX = Math.floor(maxX / (this.cellSize * CHUNK_SIZE));
    const minChunkY = Math.floor(minY / (this.cellSize * CHUNK_SIZE));
    const maxChunkY = Math.floor(maxY / (this.cellSize * CHUNK_SIZE));
    const minChunkZ = Math.floor(minZ / (this.cellSize * CHUNK_SIZE));
    const maxChunkZ = Math.floor(maxZ / (this.cellSize * CHUNK_SIZE));

    let chunkCount = 0;
    const entityChunkBase = this.entityCount * 8;

    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        for (let cz = minChunkZ; cz <= maxChunkZ; cz++) {
          const chunkKey = this.computeChunkKey(
            cx * this.cellSize * CHUNK_SIZE,
            cy * this.cellSize * CHUNK_SIZE,
            cz * this.cellSize * CHUNK_SIZE
          );

          const chunkOffset = this.getChunkOffset(chunkKey);
          const entityCount = this.chunkData[chunkOffset];

          if (entityCount < CHUNK_MAX_ENTITIES) {
            this.chunkData[chunkOffset + CHUNK_HEADER_SIZE + entityCount] = entityDataIndex;
            this.chunkData[chunkOffset]++;

            this.entityChunks[entityChunkBase + chunkCount] = chunkKey;
            chunkCount++;
          }
        }
      }
    }

    this.entityChunkCounts[this.entityCount] = chunkCount;
    this.entityCount++;
  }

  getNearEntity(entityId: number): Readonly<Near[]> {
    this.collisions.fill(-1);
    this.nearestEntities.length = 0;

    let left = 0;
    let right = this.entityCount - 1;
    let entityIndex = -1;

    while (left <= right) {
      const mid = (left + right) >>> 1;
      const midId = this.entityIds[mid];

      if (midId === entityId) {
        entityIndex = mid;
        break;
      } else if (midId < entityId) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (entityIndex === -1) {
      return this.nearestEntities;
    }

    const entityIdx = entityIndex / ENTITY_STRIDE_OBB;
    const chunkCount = this.entityChunkCounts[entityIdx];
    const entityChunkBase = entityIdx * 8;

    let collisionCount = 0;

    for (let i = 0; i < chunkCount; i++) {
      const chunkKey = this.entityChunks[entityChunkBase + i];
      const chunkOffset = this.chunkMap.get(chunkKey);

      if (chunkOffset === undefined) {
        continue;
      }

      const entitiesInChunk = this.chunkData[chunkOffset];
      const chunkDataStart = chunkOffset + CHUNK_HEADER_SIZE;

      for (let j = 0; j < entitiesInChunk; j++) {
        const otherEntityIndex = this.chunkData[chunkDataStart + j];

        if (otherEntityIndex === entityIndex) {
          continue;
        }

        this.nearestEntities[collisionCount++] = this.entities[otherEntityIndex];
      }
    }

    return this.nearestEntities;
  }

  updateEntity(entityId: number, mesh: MeshWithBoundingBox): void {
    let left = 0;
    let right = this.entityCount - 1;
    let entityIndex = -1;

    while (left <= right) {
      const mid = (left + right) >>> 1;
      const midId = this.entityIds[mid];

      if (midId === entityId) {
        entityIndex = mid;
        break;
      } else if (midId < entityId) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (entityIndex === -1) {
      return;
    }

    const entity = this.entities[entityIndex];

    const oldMinX = entity.center.x - entity.halfSize.x;
    const oldMaxX = entity.center.x + entity.halfSize.x;
    const oldMinY = entity.center.y - entity.halfSize.y;
    const oldMaxY = entity.center.y + entity.halfSize.y;
    const oldMinZ = entity.center.z - entity.halfSize.z;
    const oldMaxZ = entity.center.z + entity.halfSize.z;

    const oldMinChunkX = Math.floor(oldMinX / (this.cellSize * CHUNK_SIZE));
    const oldMaxChunkX = Math.floor(oldMaxX / (this.cellSize * CHUNK_SIZE));
    const oldMinChunkY = Math.floor(oldMinY / (this.cellSize * CHUNK_SIZE));
    const oldMaxChunkY = Math.floor(oldMaxY / (this.cellSize * CHUNK_SIZE));
    const oldMinChunkZ = Math.floor(oldMinZ / (this.cellSize * CHUNK_SIZE));
    const oldMaxChunkZ = Math.floor(oldMaxZ / (this.cellSize * CHUNK_SIZE));

    mesh.geometry.boundingBox.getSize(this.halfExtentsContainer).multiplyScalar(0.5);
    mesh.geometry.boundingBox.getCenter(this.centerContainer);

    const newMinX = this.centerContainer.x - this.halfExtentsContainer.x;
    const newMaxX = this.centerContainer.x + this.halfExtentsContainer.x;
    const newMinY = this.centerContainer.y - this.halfExtentsContainer.y;
    const newMaxY = this.centerContainer.y + this.halfExtentsContainer.y;
    const newMinZ = this.centerContainer.z - this.halfExtentsContainer.z;
    const newMaxZ = this.centerContainer.z + this.halfExtentsContainer.z;

    const newMinChunkX = Math.floor(newMinX / (this.cellSize * CHUNK_SIZE));
    const newMaxChunkX = Math.floor(newMaxX / (this.cellSize * CHUNK_SIZE));
    const newMinChunkY = Math.floor(newMinY / (this.cellSize * CHUNK_SIZE));
    const newMaxChunkY = Math.floor(newMaxY / (this.cellSize * CHUNK_SIZE));
    const newMinChunkZ = Math.floor(newMinZ / (this.cellSize * CHUNK_SIZE));
    const newMaxChunkZ = Math.floor(newMaxZ / (this.cellSize * CHUNK_SIZE));

    const chunksChanged =
      oldMinChunkX !== newMinChunkX ||
      oldMaxChunkX !== newMaxChunkX ||
      oldMinChunkY !== newMinChunkY ||
      oldMaxChunkY !== newMaxChunkY ||
      oldMinChunkZ !== newMinChunkZ ||
      oldMaxChunkZ !== newMaxChunkZ;

    entity.center.x = this.centerContainer.x;
    entity.center.y = this.centerContainer.y;
    entity.center.z = this.centerContainer.z;

    entity.halfSize.x = this.halfExtentsContainer.x;
    entity.halfSize.y = this.halfExtentsContainer.y;
    entity.halfSize.z = this.halfExtentsContainer.z;

    entity.mesh = mesh;

    this.entities[entityIndex] = entity;

    if (!chunksChanged) {
      return;
    }

    // Remove from old chunks - we know the entity is in all of them
    const entityIdx = entityIndex / ENTITY_STRIDE_OBB;
    const oldChunkCount = this.entityChunkCounts[entityIdx];
    const entityChunkBase = entityIdx * 8;

    for (let i = 0; i < oldChunkCount; i++) {
      const chunkKey = this.entityChunks[entityChunkBase + i];
      const chunkOffset = this.chunkMap.get(chunkKey);

      if (chunkOffset === undefined) {
        continue;
      }

      const entitiesInChunk = this.chunkData[chunkOffset];
      const chunkDataStart = chunkOffset + CHUNK_HEADER_SIZE;

      for (let j = 0; j < entitiesInChunk; j++) {
        if (this.chunkData[chunkDataStart + j] === entityIndex) {
          this.chunkData[chunkDataStart + j] = this.chunkData[chunkDataStart + entitiesInChunk - 1];
          this.chunkData[chunkOffset]--;
          break;
        }
      }
    }

    let newChunkCount = 0;

    for (let cx = newMinChunkX; cx <= newMaxChunkX; cx++) {
      for (let cy = newMinChunkY; cy <= newMaxChunkY; cy++) {
        for (let cz = newMinChunkZ; cz <= newMaxChunkZ; cz++) {
          const chunkKey = this.computeChunkKey(
            cx * this.cellSize * CHUNK_SIZE,
            cy * this.cellSize * CHUNK_SIZE,
            cz * this.cellSize * CHUNK_SIZE
          );

          const chunkOffset = this.getChunkOffset(chunkKey);
          const entityCount = this.chunkData[chunkOffset];

          if (entityCount < CHUNK_MAX_ENTITIES) {
            this.chunkData[chunkOffset + CHUNK_HEADER_SIZE + entityCount] = entityIndex;
            this.chunkData[chunkOffset]++;

            this.entityChunks[entityChunkBase + newChunkCount] = chunkKey;
            newChunkCount++;
          }
        }
      }
    }

    this.entityChunkCounts[entityIdx] = newChunkCount;
  }
}

const ENTITY_STRIDE_OBB = 10;

export class GridOBBInHouse {
  private readonly cellSize: number;
  private readonly maxEntities: number;
  private entityCount = 0;

  private maxEntitiesPerCollision = 128;

  // Main entity data storage
  private readonly entityData: Float64Array;

  // Optimized chunk storage - each chunk is a contiguous array
  private readonly chunkData: Int32Array;
  private readonly chunkMap: Map<string, number> = new Map(); // Changed to string key

  // Entity to chunk mapping
  private readonly entityChunks: string[]; // Changed to string array
  private readonly entityChunkCounts: Int32Array;

  // Reusable collision buffers
  private readonly collisions: Int32Array;

  obbOne = new OrientedBoundingBox();
  obbTwo = new OrientedBoundingBox();

  private entityIdToMatrix = new Map<number, Matrix4>();

  private centerContainer = new Vector3();
  private halfExtentsContainer = new Vector3();
  //private matrixContainer = new Matrix3();

  private otherCenterContainer = new Vector3();
  private otherHalfExtentsContainer = new Vector3();
  //private otherMatrixContainer = new Matrix3();

  constructor(cellSize = 16, maxEntities = 500000) {
    if (cellSize < 0.001) {
      throw new Error('Cell size must be greater than 0.001');
    }

    this.cellSize = cellSize;
    this.maxEntities = maxEntities;

    this.entityData = new Float64Array(maxEntities * ENTITY_STRIDE_OBB);

    const totalChunkSlots = maxEntities * 8;
    this.chunkData = new Int32Array(totalChunkSlots * (CHUNK_HEADER_SIZE + CHUNK_MAX_ENTITIES));

    this.entityChunks = new Array(maxEntities * 8); // Changed to regular array
    this.entityChunkCounts = new Int32Array(maxEntities);

    this.collisions = new Int32Array(this.maxEntitiesPerCollision);
  }

  private getChunkOffset(chunkKey: string): number {
    let chunkOffset = this.chunkMap.get(chunkKey);

    if (chunkOffset === undefined) {
      chunkOffset = this.allocateChunk();
      this.chunkMap.set(chunkKey, chunkOffset);
    }

    return chunkOffset;
  }

  private allocateChunk(): number {
    for (let i = 0; i < this.chunkData.length; i += CHUNK_MAX_ENTITIES + CHUNK_HEADER_SIZE) {
      if (this.chunkData[i] === 0) {
        return i;
      }
    }
    throw new Error('No more chunk slots available');
  }

  public computeChunkKey(x: number, y: number, z: number): string {
    const chunkX = Math.floor(x / (this.cellSize * CHUNK_SIZE));
    const chunkY = Math.floor(y / (this.cellSize * CHUNK_SIZE));
    const chunkZ = Math.floor(z / (this.cellSize * CHUNK_SIZE));

    return `${chunkX},${chunkY},${chunkZ}`;
  }

  addEntity(
    id: number,
    x: number,
    y: number,
    z: number,
    boundX: number,
    boundY: number,
    boundZ: number,
    matrix: Matrix4
  ): void {
    if (this.entityCount >= this.maxEntities) {
      throw new Error('Maximum entity count reached');
    }

    const entityIndex = this.entityCount * ENTITY_STRIDE_OBB;

    this.entityData[entityIndex + ID_OFFSET] = id;
    this.entityData[entityIndex + X_OFFSET] = x;
    this.entityData[entityIndex + Y_OFFSET] = y;
    this.entityData[entityIndex + Z_OFFSET] = z;
    this.entityData[entityIndex + BOUND_X_OFFSET] = boundX;
    this.entityData[entityIndex + BOUND_Y_OFFSET] = boundY;
    this.entityData[entityIndex + BOUND_Z_OFFSET] = boundZ;

    this.entityIdToMatrix.set(id, matrix);

    const minX = x - boundX / 2;
    const maxX = x + boundX / 2;
    const minY = y - boundY / 2;
    const maxY = y + boundY / 2;
    const minZ = z - boundZ / 2;
    const maxZ = z + boundZ / 2;

    const minChunkX = Math.floor(minX / (this.cellSize * CHUNK_SIZE));
    const maxChunkX = Math.floor(maxX / (this.cellSize * CHUNK_SIZE));
    const minChunkY = Math.floor(minY / (this.cellSize * CHUNK_SIZE));
    const maxChunkY = Math.floor(maxY / (this.cellSize * CHUNK_SIZE));
    const minChunkZ = Math.floor(minZ / (this.cellSize * CHUNK_SIZE));
    const maxChunkZ = Math.floor(maxZ / (this.cellSize * CHUNK_SIZE));

    let chunkCount = 0;
    const entityChunkBase = this.entityCount * 8;

    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        for (let cz = minChunkZ; cz <= maxChunkZ; cz++) {
          const chunkKey = this.computeChunkKey(
            cx * this.cellSize * CHUNK_SIZE,
            cy * this.cellSize * CHUNK_SIZE,
            cz * this.cellSize * CHUNK_SIZE
          );

          const chunkOffset = this.getChunkOffset(chunkKey);
          const entityCount = this.chunkData[chunkOffset];

          if (entityCount < CHUNK_MAX_ENTITIES) {
            this.chunkData[chunkOffset + CHUNK_HEADER_SIZE + entityCount] = entityIndex;
            this.chunkData[chunkOffset]++;

            this.entityChunks[entityChunkBase + chunkCount] = chunkKey;
            chunkCount++;
          }
        }
      }
    }

    this.entityChunkCounts[this.entityCount] = chunkCount;
    this.entityCount++;
  }

  checkCollisions(entityId: number): Readonly<Int32Array> {
    // Pre-clear collision buffers
    this.collisions.fill(-1);

    // Find entity index using binary search assuming sorted IDs
    let left = 0;
    let right = this.entityCount - 1;
    let entityIndex = -1;

    while (left <= right) {
      const mid = (left + right) >>> 1;
      const midId = this.entityData[mid * ENTITY_STRIDE_OBB + ID_OFFSET];

      if (midId === entityId) {
        entityIndex = mid * ENTITY_STRIDE_OBB;
        break;
      } else if (midId < entityId) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (entityIndex === -1) {
      return this.collisions;
    }

    const x = this.entityData[entityIndex + X_OFFSET];
    const y = this.entityData[entityIndex + Y_OFFSET];
    const z = this.entityData[entityIndex + Z_OFFSET];
    const boundX = this.entityData[entityIndex + BOUND_X_OFFSET];
    const boundY = this.entityData[entityIndex + BOUND_Y_OFFSET];
    const boundZ = this.entityData[entityIndex + BOUND_Z_OFFSET];

    this.centerContainer.set(x, y, z);
    this.halfExtentsContainer.set(boundX / 2, boundY / 2, boundZ / 2);

    const matrix = this.entityIdToMatrix.get(entityId)!;

    this.obbOne.set(this.centerContainer, this.halfExtentsContainer, matrix);

    const entityIdx = entityIndex / ENTITY_STRIDE_OBB;
    const chunkCount = this.entityChunkCounts[entityIdx];
    const entityChunkBase = entityIdx * 8;

    let collisionCount = 0;

    for (let i = 0; i < chunkCount; i++) {
      const chunkKey = this.entityChunks[entityChunkBase + i];
      const chunkOffset = this.chunkMap.get(chunkKey);

      if (chunkOffset === undefined) {
        continue;
      }

      // Direct array access for better performance
      const entitiesInChunk = this.chunkData[chunkOffset];
      const chunkDataStart = chunkOffset + CHUNK_HEADER_SIZE;

      for (let j = 0; j < entitiesInChunk; j++) {
        const otherEntityIndex = this.chunkData[chunkDataStart + j];

        // Skip if it's the same entity or we've already processed it
        if (otherEntityIndex === entityIndex) {
          continue;
        }

        // Cache other entity data
        const otherX = this.entityData[otherEntityIndex + X_OFFSET];
        const otherY = this.entityData[otherEntityIndex + Y_OFFSET];
        const otherZ = this.entityData[otherEntityIndex + Z_OFFSET];

        const otherBoundX = this.entityData[otherEntityIndex + BOUND_X_OFFSET];
        const otherBoundY = this.entityData[otherEntityIndex + BOUND_Y_OFFSET];
        const otherBoundZ = this.entityData[otherEntityIndex + BOUND_Z_OFFSET];

        this.otherCenterContainer.set(otherX, otherY, otherZ);
        this.otherHalfExtentsContainer.set(otherBoundX / 2, otherBoundY / 2, otherBoundZ / 2);

        const otherMatrix = this.entityIdToMatrix.get(
          this.entityData[otherEntityIndex + ID_OFFSET]
        )!;

        this.obbTwo.set(this.otherCenterContainer, this.otherHalfExtentsContainer, otherMatrix);

        const result = this.obbOne.intersects(this.obbTwo);

        if (result.intersected) {
          this.collisions[collisionCount++] = this.entityData[otherEntityIndex + ID_OFFSET];
        }
      }
    }

    this.collisions.sort();

    for (let i = 1; i < this.maxEntitiesPerCollision - 1; i++) {
      const first = this.collisions[i];

      if (first !== -1 && first === this.collisions[i + 1]) {
        this.collisions[i] = -1;

        collisionCount--;
      }
    }

    this.collisions[0] = collisionCount;

    return this.collisions;
  }

  updateEntity(
    id: number,
    x: number,
    y: number,
    z: number,
    maybeBoundX?: number,
    maybeBoundY?: number,
    maybeBoundZ?: number
  ): void {
    // Find entity index using binary search
    let left = 0;
    let right = this.entityCount - 1;
    let entityIndex = -1;

    while (left <= right) {
      const mid = (left + right) >>> 1;
      const midId = this.entityData[mid * ENTITY_STRIDE_OBB + ID_OFFSET];

      if (midId === id) {
        entityIndex = mid * ENTITY_STRIDE_OBB;
        break;
      } else if (midId < id) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (entityIndex === -1) {
      return;
    }

    const oldX = this.entityData[entityIndex + X_OFFSET];
    const oldY = this.entityData[entityIndex + Y_OFFSET];
    const oldZ = this.entityData[entityIndex + Z_OFFSET];
    const oldBoundX = this.entityData[entityIndex + BOUND_X_OFFSET];
    const oldBoundY = this.entityData[entityIndex + BOUND_Y_OFFSET];
    const oldBoundZ = this.entityData[entityIndex + BOUND_Z_OFFSET];

    // Update bounds only if provided
    const boundX = maybeBoundX ?? oldBoundX;
    const boundY = maybeBoundY ?? oldBoundY;
    const boundZ = maybeBoundZ ?? oldBoundZ;

    // Calculate chunk boundaries for old position
    const oldMinX = oldX - oldBoundX / 2;
    const oldMaxX = oldX + oldBoundX / 2;
    const oldMinY = oldY - oldBoundY / 2;
    const oldMaxY = oldY + oldBoundY / 2;
    const oldMinZ = oldZ - oldBoundZ / 2;
    const oldMaxZ = oldZ + oldBoundZ / 2;

    const oldMinChunkX = Math.floor(oldMinX / (this.cellSize * CHUNK_SIZE));
    const oldMaxChunkX = Math.floor(oldMaxX / (this.cellSize * CHUNK_SIZE));
    const oldMinChunkY = Math.floor(oldMinY / (this.cellSize * CHUNK_SIZE));
    const oldMaxChunkY = Math.floor(oldMaxY / (this.cellSize * CHUNK_SIZE));
    const oldMinChunkZ = Math.floor(oldMinZ / (this.cellSize * CHUNK_SIZE));
    const oldMaxChunkZ = Math.floor(oldMaxZ / (this.cellSize * CHUNK_SIZE));

    // Calculate chunk boundaries for new position
    const newMinX = x - boundX / 2;
    const newMaxX = x + boundX / 2;
    const newMinY = y - boundY / 2;
    const newMaxY = y + boundY / 2;
    const newMinZ = z - boundZ / 2;
    const newMaxZ = z + boundZ / 2;

    const newMinChunkX = Math.floor(newMinX / (this.cellSize * CHUNK_SIZE));
    const newMaxChunkX = Math.floor(newMaxX / (this.cellSize * CHUNK_SIZE));
    const newMinChunkY = Math.floor(newMinY / (this.cellSize * CHUNK_SIZE));
    const newMaxChunkY = Math.floor(newMaxY / (this.cellSize * CHUNK_SIZE));
    const newMinChunkZ = Math.floor(newMinZ / (this.cellSize * CHUNK_SIZE));
    const newMaxChunkZ = Math.floor(newMaxZ / (this.cellSize * CHUNK_SIZE));

    // Quick check if chunk update is needed
    const chunksChanged =
      oldMinChunkX !== newMinChunkX ||
      oldMaxChunkX !== newMaxChunkX ||
      oldMinChunkY !== newMinChunkY ||
      oldMaxChunkY !== newMaxChunkY ||
      oldMinChunkZ !== newMinChunkZ ||
      oldMaxChunkZ !== newMaxChunkZ;

    // Update position and bounds
    this.entityData[entityIndex + X_OFFSET] = x;
    this.entityData[entityIndex + Y_OFFSET] = y;
    this.entityData[entityIndex + Z_OFFSET] = z;
    if (maybeBoundX !== undefined) {
      this.entityData[entityIndex + BOUND_X_OFFSET] = maybeBoundX;
    }

    if (maybeBoundY !== undefined) {
      this.entityData[entityIndex + BOUND_Y_OFFSET] = maybeBoundY;
    }

    if (maybeBoundZ !== undefined) {
      this.entityData[entityIndex + BOUND_Z_OFFSET] = maybeBoundZ;
    }

    // If chunks haven't changed, we're done
    if (!chunksChanged) {
      return;
    }

    // Remove from old chunks
    const entityIdx = entityIndex / ENTITY_STRIDE_OBB;
    const oldChunkCount = this.entityChunkCounts[entityIdx];
    const entityChunkBase = entityIdx * 8;

    for (let i = 0; i < oldChunkCount; i++) {
      const chunkKey = this.entityChunks[entityChunkBase + i];
      const chunkOffset = this.chunkMap.get(chunkKey);

      if (chunkOffset === undefined) {
        continue;
      }

      // Find and remove entity from chunk
      const entitiesInChunk = this.chunkData[chunkOffset];
      const chunkDataStart = chunkOffset + CHUNK_HEADER_SIZE;

      for (let j = 0; j < entitiesInChunk; j++) {
        if (this.chunkData[chunkDataStart + j] === entityIndex) {
          // Move last entity to this slot and decrease count
          this.chunkData[chunkDataStart + j] = this.chunkData[chunkDataStart + entitiesInChunk - 1];
          this.chunkData[chunkOffset]--;
          break;
        }
      }
    }

    // Add to new chunks
    let newChunkCount = 0;

    for (let cx = newMinChunkX; cx <= newMaxChunkX; cx++) {
      for (let cy = newMinChunkY; cy <= newMaxChunkY; cy++) {
        for (let cz = newMinChunkZ; cz <= newMaxChunkZ; cz++) {
          const chunkKey = this.computeChunkKey(
            cx * this.cellSize * CHUNK_SIZE,
            cy * this.cellSize * CHUNK_SIZE,
            cz * this.cellSize * CHUNK_SIZE
          );

          const chunkOffset = this.getChunkOffset(chunkKey);
          const entityCount = this.chunkData[chunkOffset];

          if (entityCount < CHUNK_MAX_ENTITIES) {
            this.chunkData[chunkOffset + CHUNK_HEADER_SIZE + entityCount] = entityIndex;
            this.chunkData[chunkOffset]++;

            this.entityChunks[entityChunkBase + newChunkCount] = chunkKey;
            newChunkCount++;
          }
        }
      }
    }

    this.entityChunkCounts[entityIdx] = newChunkCount;
  }
}

//Use Three.js OBB for testing in-house OBB
export class GridOBBThreeJS {
  private readonly cellSize: number;
  private readonly maxEntities: number;
  private entityCount = 0;

  private maxEntitiesPerCollision = 128;

  // Main entity data storage
  private readonly entityData: Float64Array;

  // Optimized chunk storage - each chunk is a contiguous array
  private readonly chunkData: Int32Array;
  private readonly chunkMap: Map<string, number> = new Map(); // Changed to string key

  // Entity to chunk mapping
  private readonly entityChunks: string[]; // Changed to string array
  private readonly entityChunkCounts: Int32Array;

  // Reusable collision buffers
  private readonly collisions: Int32Array;

  obbOne = new OBB();
  obbTwo = new OBB();

  private entityIdToMatrix = new Map<number, Matrix4>();

  private centerContainer = new Vector3();
  private halfExtentsContainer = new Vector3();
  //private matrixContainer = new Matrix3();

  private otherCenterContainer = new Vector3();
  private otherHalfExtentsContainer = new Vector3();
  //private otherMatrixContainer = new Matrix3();

  constructor(cellSize = 16, maxEntities = 500000) {
    if (cellSize < 0.001) {
      throw new Error('Cell size must be greater than 0.001');
    }

    this.cellSize = cellSize;
    this.maxEntities = maxEntities;

    this.entityData = new Float64Array(maxEntities * ENTITY_STRIDE_OBB);

    const totalChunkSlots = maxEntities * 8;
    this.chunkData = new Int32Array(totalChunkSlots * (CHUNK_HEADER_SIZE + CHUNK_MAX_ENTITIES));

    this.entityChunks = new Array(maxEntities * 8); // Changed to regular array
    this.entityChunkCounts = new Int32Array(maxEntities);

    this.collisions = new Int32Array(this.maxEntitiesPerCollision);
  }

  private getChunkOffset(chunkKey: string): number {
    let chunkOffset = this.chunkMap.get(chunkKey);

    if (chunkOffset === undefined) {
      chunkOffset = this.allocateChunk();
      this.chunkMap.set(chunkKey, chunkOffset);
    }

    return chunkOffset;
  }

  private allocateChunk(): number {
    for (let i = 0; i < this.chunkData.length; i += CHUNK_MAX_ENTITIES + CHUNK_HEADER_SIZE) {
      if (this.chunkData[i] === 0) {
        return i;
      }
    }
    throw new Error('No more chunk slots available');
  }

  public computeChunkKey(x: number, y: number, z: number): string {
    const chunkX = Math.floor(x / (this.cellSize * CHUNK_SIZE));
    const chunkY = Math.floor(y / (this.cellSize * CHUNK_SIZE));
    const chunkZ = Math.floor(z / (this.cellSize * CHUNK_SIZE));

    return `${chunkX},${chunkY},${chunkZ}`;
  }

  addEntity(
    id: number,
    x: number,
    y: number,
    z: number,
    boundX: number,
    boundY: number,
    boundZ: number,
    matrix: Matrix4
  ): void {
    if (this.entityCount >= this.maxEntities) {
      throw new Error('Maximum entity count reached');
    }

    const entityIndex = this.entityCount * ENTITY_STRIDE_OBB;

    this.entityData[entityIndex + ID_OFFSET] = id;
    this.entityData[entityIndex + X_OFFSET] = x;
    this.entityData[entityIndex + Y_OFFSET] = y;
    this.entityData[entityIndex + Z_OFFSET] = z;
    this.entityData[entityIndex + BOUND_X_OFFSET] = boundX;
    this.entityData[entityIndex + BOUND_Y_OFFSET] = boundY;
    this.entityData[entityIndex + BOUND_Z_OFFSET] = boundZ;

    this.entityIdToMatrix.set(id, matrix);

    const minX = x - boundX / 2;
    const maxX = x + boundX / 2;
    const minY = y - boundY / 2;
    const maxY = y + boundY / 2;
    const minZ = z - boundZ / 2;
    const maxZ = z + boundZ / 2;

    const minChunkX = Math.floor(minX / (this.cellSize * CHUNK_SIZE));
    const maxChunkX = Math.floor(maxX / (this.cellSize * CHUNK_SIZE));
    const minChunkY = Math.floor(minY / (this.cellSize * CHUNK_SIZE));
    const maxChunkY = Math.floor(maxY / (this.cellSize * CHUNK_SIZE));
    const minChunkZ = Math.floor(minZ / (this.cellSize * CHUNK_SIZE));
    const maxChunkZ = Math.floor(maxZ / (this.cellSize * CHUNK_SIZE));

    let chunkCount = 0;
    const entityChunkBase = this.entityCount * 8;

    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        for (let cz = minChunkZ; cz <= maxChunkZ; cz++) {
          const chunkKey = this.computeChunkKey(
            cx * this.cellSize * CHUNK_SIZE,
            cy * this.cellSize * CHUNK_SIZE,
            cz * this.cellSize * CHUNK_SIZE
          );

          const chunkOffset = this.getChunkOffset(chunkKey);
          const entityCount = this.chunkData[chunkOffset];

          if (entityCount < CHUNK_MAX_ENTITIES) {
            this.chunkData[chunkOffset + CHUNK_HEADER_SIZE + entityCount] = entityIndex;
            this.chunkData[chunkOffset]++;

            this.entityChunks[entityChunkBase + chunkCount] = chunkKey;
            chunkCount++;
          }
        }
      }
    }

    this.entityChunkCounts[this.entityCount] = chunkCount;
    this.entityCount++;
  }

  checkCollisions(entityId: number): Readonly<Int32Array> {
    // Pre-clear collision buffers
    this.collisions.fill(-1);

    // Find entity index using binary search assuming sorted IDs
    let left = 0;
    let right = this.entityCount - 1;
    let entityIndex = -1;

    while (left <= right) {
      const mid = (left + right) >>> 1;
      const midId = this.entityData[mid * ENTITY_STRIDE_OBB + ID_OFFSET];

      if (midId === entityId) {
        entityIndex = mid * ENTITY_STRIDE_OBB;
        break;
      } else if (midId < entityId) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (entityIndex === -1) {
      return this.collisions;
    }

    // Cache entity data in local variables to avoid repeated array access
    const x = this.entityData[entityIndex + X_OFFSET];
    const y = this.entityData[entityIndex + Y_OFFSET];
    const z = this.entityData[entityIndex + Z_OFFSET];
    const boundX = this.entityData[entityIndex + BOUND_X_OFFSET];
    const boundY = this.entityData[entityIndex + BOUND_Y_OFFSET];
    const boundZ = this.entityData[entityIndex + BOUND_Z_OFFSET];

    this.centerContainer.set(x, y, z);
    this.halfExtentsContainer.set(boundX / 2, boundY / 2, boundZ / 2);

    const matrix = this.entityIdToMatrix.get(entityId)!;

    this.obbOne.set(
      this.centerContainer,
      this.halfExtentsContainer,
      new Matrix3().setFromMatrix4(matrix)
    );

    const entityIdx = entityIndex / ENTITY_STRIDE_OBB;
    const chunkCount = this.entityChunkCounts[entityIdx];
    const entityChunkBase = entityIdx * 8;

    let collisionCount = 0;

    // Process each chunk the entity belongs to
    for (let i = 0; i < chunkCount; i++) {
      const chunkKey = this.entityChunks[entityChunkBase + i];
      const chunkOffset = this.chunkMap.get(chunkKey);

      if (chunkOffset === undefined) {
        continue;
      }

      // Direct array access for better performance
      const entitiesInChunk = this.chunkData[chunkOffset];
      const chunkDataStart = chunkOffset + CHUNK_HEADER_SIZE;

      // Unrolled inner loop for better performance
      for (let j = 0; j < entitiesInChunk; j++) {
        const otherEntityIndex = this.chunkData[chunkDataStart + j];

        // Skip if it's the same entity or we've already processed it
        if (otherEntityIndex === entityIndex) {
          continue;
        }

        // Cache other entity data
        const otherX = this.entityData[otherEntityIndex + X_OFFSET];
        const otherY = this.entityData[otherEntityIndex + Y_OFFSET];
        const otherZ = this.entityData[otherEntityIndex + Z_OFFSET];

        const otherBoundX = this.entityData[otherEntityIndex + BOUND_X_OFFSET];
        const otherBoundY = this.entityData[otherEntityIndex + BOUND_Y_OFFSET];
        const otherBoundZ = this.entityData[otherEntityIndex + BOUND_Z_OFFSET];

        this.otherCenterContainer.set(otherX, otherY, otherZ);
        this.otherHalfExtentsContainer.set(otherBoundX / 2, otherBoundY / 2, otherBoundZ / 2);

        const otherMatrix = this.entityIdToMatrix.get(
          this.entityData[otherEntityIndex + ID_OFFSET]
        );

        if (otherMatrix === undefined) {
          throw new Error('Matrix not found');
        }

        this.obbTwo.set(
          this.otherCenterContainer,
          this.otherHalfExtentsContainer,
          new Matrix3().setFromMatrix4(otherMatrix)
        );

        if (this.obbOne.intersectsOBB(this.obbTwo)) {
          this.collisions[collisionCount++] = this.entityData[otherEntityIndex + ID_OFFSET];
        }
      }
    }

    this.collisions.sort();

    for (let i = 1; i < this.maxEntitiesPerCollision - 1; i++) {
      if (this.collisions[i] !== -1 && this.collisions[i] === this.collisions[i + 1]) {
        this.collisions[i] = -1;

        collisionCount--;
      }
    }

    this.collisions[0] = collisionCount;

    return this.collisions;
  }

  updateEntity(
    id: number,
    x: number,
    y: number,
    z: number,
    maybeBoundX?: number,
    maybeBoundY?: number,
    maybeBoundZ?: number
  ): void {
    // Find entity index using binary search
    let left = 0;
    let right = this.entityCount - 1;
    let entityIndex = -1;

    while (left <= right) {
      const mid = (left + right) >>> 1;
      const midId = this.entityData[mid * ENTITY_STRIDE_OBB + ID_OFFSET];

      if (midId === id) {
        entityIndex = mid * ENTITY_STRIDE_OBB;
        break;
      } else if (midId < id) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (entityIndex === -1) {
      return;
    }

    const oldX = this.entityData[entityIndex + X_OFFSET];
    const oldY = this.entityData[entityIndex + Y_OFFSET];
    const oldZ = this.entityData[entityIndex + Z_OFFSET];
    const oldBoundX = this.entityData[entityIndex + BOUND_X_OFFSET];
    const oldBoundY = this.entityData[entityIndex + BOUND_Y_OFFSET];
    const oldBoundZ = this.entityData[entityIndex + BOUND_Z_OFFSET];

    // Update bounds only if provided
    const boundX = maybeBoundX ?? oldBoundX;
    const boundY = maybeBoundY ?? oldBoundY;
    const boundZ = maybeBoundZ ?? oldBoundZ;

    // Calculate chunk boundaries for old position
    const oldMinX = oldX - oldBoundX / 2;
    const oldMaxX = oldX + oldBoundX / 2;
    const oldMinY = oldY - oldBoundY / 2;
    const oldMaxY = oldY + oldBoundY / 2;
    const oldMinZ = oldZ - oldBoundZ / 2;
    const oldMaxZ = oldZ + oldBoundZ / 2;

    const oldMinChunkX = Math.floor(oldMinX / (this.cellSize * CHUNK_SIZE));
    const oldMaxChunkX = Math.floor(oldMaxX / (this.cellSize * CHUNK_SIZE));
    const oldMinChunkY = Math.floor(oldMinY / (this.cellSize * CHUNK_SIZE));
    const oldMaxChunkY = Math.floor(oldMaxY / (this.cellSize * CHUNK_SIZE));
    const oldMinChunkZ = Math.floor(oldMinZ / (this.cellSize * CHUNK_SIZE));
    const oldMaxChunkZ = Math.floor(oldMaxZ / (this.cellSize * CHUNK_SIZE));

    // Calculate chunk boundaries for new position
    const newMinX = x - boundX / 2;
    const newMaxX = x + boundX / 2;
    const newMinY = y - boundY / 2;
    const newMaxY = y + boundY / 2;
    const newMinZ = z - boundZ / 2;
    const newMaxZ = z + boundZ / 2;

    const newMinChunkX = Math.floor(newMinX / (this.cellSize * CHUNK_SIZE));
    const newMaxChunkX = Math.floor(newMaxX / (this.cellSize * CHUNK_SIZE));
    const newMinChunkY = Math.floor(newMinY / (this.cellSize * CHUNK_SIZE));
    const newMaxChunkY = Math.floor(newMaxY / (this.cellSize * CHUNK_SIZE));
    const newMinChunkZ = Math.floor(newMinZ / (this.cellSize * CHUNK_SIZE));
    const newMaxChunkZ = Math.floor(newMaxZ / (this.cellSize * CHUNK_SIZE));

    // Quick check if chunk update is needed
    const chunksChanged =
      oldMinChunkX !== newMinChunkX ||
      oldMaxChunkX !== newMaxChunkX ||
      oldMinChunkY !== newMinChunkY ||
      oldMaxChunkY !== newMaxChunkY ||
      oldMinChunkZ !== newMinChunkZ ||
      oldMaxChunkZ !== newMaxChunkZ;

    // Update position and bounds
    this.entityData[entityIndex + X_OFFSET] = x;
    this.entityData[entityIndex + Y_OFFSET] = y;
    this.entityData[entityIndex + Z_OFFSET] = z;
    if (maybeBoundX !== undefined) {
      this.entityData[entityIndex + BOUND_X_OFFSET] = maybeBoundX;
    }

    if (maybeBoundY !== undefined) {
      this.entityData[entityIndex + BOUND_Y_OFFSET] = maybeBoundY;
    }

    if (maybeBoundZ !== undefined) {
      this.entityData[entityIndex + BOUND_Z_OFFSET] = maybeBoundZ;
    }

    // If chunks haven't changed, we're done
    if (!chunksChanged) {
      return;
    }

    // Remove from old chunks
    const entityIdx = entityIndex / ENTITY_STRIDE_OBB;
    const oldChunkCount = this.entityChunkCounts[entityIdx];
    const entityChunkBase = entityIdx * 8;

    for (let i = 0; i < oldChunkCount; i++) {
      const chunkKey = this.entityChunks[entityChunkBase + i];
      const chunkOffset = this.chunkMap.get(chunkKey);

      if (chunkOffset === undefined) {
        continue;
      }

      // Find and remove entity from chunk
      const entitiesInChunk = this.chunkData[chunkOffset];
      const chunkDataStart = chunkOffset + CHUNK_HEADER_SIZE;

      for (let j = 0; j < entitiesInChunk; j++) {
        if (this.chunkData[chunkDataStart + j] === entityIndex) {
          // Move last entity to this slot and decrease count
          this.chunkData[chunkDataStart + j] = this.chunkData[chunkDataStart + entitiesInChunk - 1];
          this.chunkData[chunkOffset]--;
          break;
        }
      }
    }

    // Add to new chunks
    let newChunkCount = 0;

    for (let cx = newMinChunkX; cx <= newMaxChunkX; cx++) {
      for (let cy = newMinChunkY; cy <= newMaxChunkY; cy++) {
        for (let cz = newMinChunkZ; cz <= newMaxChunkZ; cz++) {
          const chunkKey = this.computeChunkKey(
            cx * this.cellSize * CHUNK_SIZE,
            cy * this.cellSize * CHUNK_SIZE,
            cz * this.cellSize * CHUNK_SIZE
          );

          const chunkOffset = this.getChunkOffset(chunkKey);
          const entityCount = this.chunkData[chunkOffset];

          if (entityCount < CHUNK_MAX_ENTITIES) {
            this.chunkData[chunkOffset + CHUNK_HEADER_SIZE + entityCount] = entityIndex;
            this.chunkData[chunkOffset]++;

            this.entityChunks[entityChunkBase + newChunkCount] = chunkKey;
            newChunkCount++;
          }
        }
      }
    }

    this.entityChunkCounts[entityIdx] = newChunkCount;
  }
}
