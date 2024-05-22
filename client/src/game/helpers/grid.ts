import {BoxGeometry, Mesh, MeshBasicMaterial} from 'three';
import type {Object3D, Vector3} from 'three';
import {scene} from '../window.ts';

const randomColor = () => Math.random() * 0xffffff;
// Define constants
export const GRID_HELPER_SIZE = 5000000;
export const GRID_HELPER_DIVISIONS = 500000;
export const CELL_SIZE = GRID_HELPER_SIZE / GRID_HELPER_DIVISIONS;

export class SpatialHashGrid {
  gridSize: number = GRID_HELPER_SIZE;
  cellSize: number = CELL_SIZE;
  cellsDebug: Map<number, Object3D> = new Map();
  cells: Map<number, Set<Object3D>> = new Map();

  constructor() {
    this.cells = new Map();
  }

  // Convert 3D coordinates to a single numeric key
  getKey(x: number, y: number, z: number): number {
    return x + y * this.gridSize + z * this.gridSize * this.gridSize;
  }

  // Insert an object into the grid
  insert(object: Object3D) {
    const {position} = object;
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    const key = this.getKey(x, y, z);
    const cell = this.cells.get(key);

    //create random color wireframe cubes
    //
    // const geometry = new BoxGeometry(10, 10, 10);
    // const material = new LineBasicMaterial({color: randomColor()});
    // const wireframe = new LineSegments(new WireframeGeometry(geometry), material);
    // wireframe.position.set(position.x, position.y, position.z);
    // scene.add(wireframe);
    //
    //
    //

    if (!cell) {
      this.cells.set(key, new Set([object]));

      const geometry = new BoxGeometry(10, 10, 10);
      const material = new MeshBasicMaterial({color: randomColor(), wireframe: true});

      const box = new Mesh(geometry, material);

      box.position.set(position.x, position.y, position.z);
      scene.add(box);

      return;
    }

    cell.add(object);
  }

  remove(object: Object3D, positionBefore?: Vector3) {
    const {position: current} = object;
    const position = positionBefore ?? current;

    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    const key = this.getKey(x, y, z);
    const cell = this.cells.get(key);

    if (!cell) {
      return;
    }

    cell.delete(object);

    if (cell.size === 0) {
      this.cells.delete(key);
    }
  }

  move(object: Object3D, positionBefore: Vector3) {
    const {position} = object;
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    const key = this.getKey(x, y, z);

    const xBefore = Math.floor(positionBefore.x / this.cellSize);
    const yBefore = Math.floor(positionBefore.y / this.cellSize);
    const zBefore = Math.floor(positionBefore.z / this.cellSize);
    const keyBefore = this.getKey(xBefore, yBefore, zBefore);

    if (key === keyBefore) {
      return;
    }

    this.remove(object, positionBefore);
    this.insert(object);
  }

  // Query nearby objects within a given radius
  query(position: Vector3, radius: number): Object3D[] {
    const min = position.clone().subScalar(radius).divideScalar(this.cellSize).floor();
    const max = position.clone().addScalar(radius).divideScalar(this.cellSize).floor();
    const temp: WeakSet<Object3D>[] = [];
    for (let {x} = min; x <= max.x; x++) {
      for (let {y} = min; y <= max.y; y++) {
        for (let {z} = min; z <= max.z; z++) {
          const key = this.getKey(x, y, z);
          const cell = this.cells.get(key);

          if (cell) {
            temp.push(cell);
          }
        }
      }
    }

    return Array.prototype.concat.apply([], temp);
  }
}
