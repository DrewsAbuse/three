import {describe, test} from 'node:test';
import assert from 'node:assert';
import {Matrix4} from 'three';
import {GridAABB, GridOBBInHouse, GridOBBThreeJS} from './grid.ts';

describe('Grid AABB', () => {
  test('runPerformanceTests', () => {
    const runPerformanceTests = (entityCount = 100000) => {
      const grid = new GridAABB();

      const RandomArray1 = new Float32Array(entityCount * 3).map(() => Math.random() * 1000);
      const RandomArray2 = new Float32Array(entityCount * 3).map(() => Math.random() * 1000);

      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.debug(`[${entry.name}] Duration: ${entry.duration.toFixed(2)}ms`);
        });
      });
      observer.observe({entryTypes: ['measure']});

      performance.mark('addEntities-start');
      for (let i = 0; i < entityCount; i++) {
        const id = i;
        const x = RandomArray1[i];
        const y = RandomArray1[i + 1];
        const z = RandomArray1[i + 2];
        const boundX = 10;
        const boundY = 10;
        const boundZ = 10;
        grid.addEntity(id, x, y, z, boundX, boundY, boundZ);
      }
      performance.mark('addEntities-end');
      performance.measure('Add Entities', 'addEntities-start', 'addEntities-end');

      performance.mark('updateEntities-start');
      for (let i = 0; i < entityCount; i++) {
        const x = RandomArray2[i];
        const y = RandomArray2[i + 1];
        const z = RandomArray2[i + 2];
        grid.updateEntity(i, x, y, z);
      }
      performance.mark('updateEntities-end');
      performance.measure('Update Entities', 'updateEntities-start', 'updateEntities-end');

      performance.mark('checkCollisions-start');
      for (let i = 0; i < entityCount; i++) {
        grid.checkCollisions(i);
      }
      performance.mark('checkCollisions-end');
      performance.measure('Check Collisions', 'checkCollisions-start', 'checkCollisions-end');

      performance.clearMarks();
      performance.clearMeasures();
    };

    runPerformanceTests();
  });

  test('Grid Add Entity', () => {
    const grid = new GridAABB();

    grid.addEntity(99, 100000, 100000, 100000, 5, 5, 5);

    grid.addEntity(111, 100005, 100005, 100005, 10, 10, 10);

    grid.addEntity(666, 100002, 100002, 100002, 10, 10, 10);

    assert.strictEqual(grid.checkCollisions(99)[0], 2, 'Entity 99 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(111)[0], 2, 'Entity 111 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(666)[0], 2, 'Entity 666 should have 2 collisions');

    assert.strictEqual(grid.checkCollisions(99).at(-1), 666, 'Entity 99 should collide with 666');
    assert.strictEqual(grid.checkCollisions(99).at(-2), 111, 'Entity 99 should collide with 111');

    assert.strictEqual(grid.checkCollisions(111).at(-1), 666, 'Entity 111 should collide with 666');
    assert.strictEqual(grid.checkCollisions(111).at(-2), 99, 'Entity 111 should collide with 99');

    assert.strictEqual(grid.checkCollisions(666).at(-1), 111, 'Entity 666 should collide with 111');
    assert.strictEqual(grid.checkCollisions(666).at(-2), 99, 'Entity 666 should collide with 99');
  });

  test('Grid Update Entity - Found Positive', () => {
    const grid = new GridAABB();

    grid.addEntity(99, -32, -32, -32, 5, 5, 5);

    grid.addEntity(111, 5, 5, 5, 10, 10, 10);

    grid.addEntity(666, 2, 2, 2, 10, 10, 10);

    grid.updateEntity(99, 1, 1, 1);

    assert.strictEqual(grid.checkCollisions(99)[0], 2, 'Entity 99 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(111)[0], 2, 'Entity 111 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(666)[0], 2, 'Entity 666 should have 2 collisions');

    assert.strictEqual(
      grid.checkCollisions(99).indexOf(666),
      127,
      'Entity 99 should collide with 666'
    );
    assert.strictEqual(
      grid.checkCollisions(99).indexOf(111),
      119,
      'Entity 99 should collide with 111'
    );

    assert.strictEqual(grid.checkCollisions(111).at(-1), 666, 'Entity 111 should collide with 666');
    assert.strictEqual(grid.checkCollisions(111).at(-2), 99, 'Entity 111 should collide with 99');

    assert.strictEqual(grid.checkCollisions(666).at(-1), 111, 'Entity 666 should collide with 111');
    assert.strictEqual(grid.checkCollisions(666).at(-2), 99, 'Entity 666 should collide with 99');
  });

  test('Grid Update Entity - Found Negative', () => {
    const grid = new GridAABB();

    grid.addEntity(99, -32, -32, -32, 2, 2, 2);

    grid.addEntity(111, 5, 5, 5, 10, 10, 10);

    grid.addEntity(666, 2, 2, 2, 10, 10, 10);

    grid.updateEntity(99, 1, 1, 1);
    grid.updateEntity(99, 100000, 100000, 100000);

    assert.strictEqual(grid.checkCollisions(99)[0], 0, 'Entity 99 should have 0 collisions');
    assert.strictEqual(grid.checkCollisions(111)[0], 1, 'Entity 111 should have 1 collisions');
    assert.strictEqual(grid.checkCollisions(666)[0], 1, 'Entity 666 should have 1 collisions');

    assert.strictEqual(grid.checkCollisions(99).at(-1), -1, 'Entity 99 should collide with no one');
    assert.strictEqual(grid.checkCollisions(99).at(-2), -1, 'Entity 99 should collide with no one');
  });

  test('Large Distance', () => {
    // Test extremely large distances
    const largeDistanceGrid = new GridAABB(1000); // Large cell size

    const largeCoords = [
      {id: 100, x: 1_000_000, y: 1_000_000, z: 1_000_000, bound: 1000},
      {id: 200, x: 1_000_010, y: 1_000_010, z: 1_000_010, bound: 1000},
      {id: 300, x: 10_000_000, y: 10_000_000, z: 10_000_000, bound: 10000},
    ];

    largeCoords.forEach(coord => {
      largeDistanceGrid.addEntity(
        coord.id,
        coord.x,
        coord.y,
        coord.z,
        coord.bound,
        coord.bound,
        coord.bound
      );
    });

    const largeCollisions1 = largeDistanceGrid.checkCollisions(100);

    assert.strictEqual(largeCollisions1[0], 1, 'Entities very close should collide');
    assert.strictEqual(largeCollisions1.at(-1), 200, 'Collision with second large entity expected');

    const largeCollisions2 = largeDistanceGrid.checkCollisions(300);

    assert.strictEqual(largeCollisions2[0], 0, 'Far entities should not collide');
  });

  test('Grid Precision small', () => {
    const precisionGrid = new GridAABB(0.1); // small cell size

    // Test Small entities

    precisionGrid.addEntity(1, 1, 1, 1, 0.1, 0.1, 0.1);
    precisionGrid.addEntity(2, 1.1, 1.1, 1.1, 0.5, 0.5, 0.5);

    const collisions = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions[0], 1, 'Add: Small entities should detect collision');
    assert.strictEqual(collisions.at(-1), 2, 'Add: Collision with second entity expected');

    precisionGrid.updateEntity(2, 1.2, 1.2, 1.2);

    const collisions2 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions2[0],
      1,
      'Update in bound range: Small entities should detect collision'
    );
    assert.strictEqual(
      collisions2.at(-1),
      2,
      'Update in bound range: Collision with second entity expected'
    );

    precisionGrid.updateEntity(2, 1.5, 1.5, 1.5);

    const collisions3 = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions3[0], 0, 'Update out of bound range: Entities should not collide');

    precisionGrid.updateEntity(2, 1.1, 1.1, 1.1);

    const collisions4 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions4[0],
      1,
      'Update back in bound range: Small entities should detect collision'
    );
    assert.strictEqual(
      collisions4.at(-1),
      2,
      'Update back in bound range: Collision with second entity expected'
    );
  });

  test('Grid Precision tiny', () => {
    // Test extremely precise positioning
    const precisionGrid = new GridAABB(0.001); // Tiny cell size

    // Test very small entities
    precisionGrid.addEntity(1, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001);
    precisionGrid.addEntity(2, 0.0011, 0.0011, 0.0011, 0.001, 0.001, 0.001);
    const collisions = precisionGrid.checkCollisions(1);
    assert.strictEqual(collisions[0], 1, 'Tiny entities should detect collision');
    assert.strictEqual(collisions.at(-1), 2, 'Collision with second entity expected');

    precisionGrid.updateEntity(2, 0.0012, 0.0012, 0.0012);

    const collisions2 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions2[0],
      1,
      'Update in bound range: Tiny entities should detect collision'
    );
    assert.strictEqual(
      collisions2.at(-1),
      2,
      'Update in bound range: Collision with second entity expected'
    );

    precisionGrid.updateEntity(2, 0.002, 0.002, 0.002);

    const collisions3 = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions3[0], 1, 'Update to bound range: Entities should collide');
    assert.strictEqual(
      collisions3.at(-1),
      2,
      'Update to bound range: Collision with second entity'
    );

    precisionGrid.updateEntity(2, 0.0021, 0.0021, 0.0021);

    const collisions4 = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions4[0], 0, 'Update out of bound range: Entities should not collide');
    assert.strictEqual(collisions4.at(-1), -1, 'Update out of bound range: No collision expected');

    precisionGrid.updateEntity(2, 0.0011, 0.0011, 0.0011);

    const collisions5 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions5[0],
      1,
      'Update back in bound range: Tiny entities should detect collision'
    );
    assert.strictEqual(
      collisions5.at(-1),
      2,
      'Update back in bound range: Collision with second entity expected'
    );
  });

  test('Grid Stress and Limit Tests', () => {
    // Test maximum entity capacity
    const maxEntitiesGrid = new GridAABB(16, 500_000);

    // Generate maximum number of entities
    const entityCount = 500_000;
    const randomOffset = 1000;

    for (let i = 0; i < entityCount; i++) {
      maxEntitiesGrid.addEntity(
        i,
        Math.random() * randomOffset,
        Math.random() * randomOffset,
        Math.random() * randomOffset,
        10,
        10,
        10
      );
    }

    for (let i = 0; i < entityCount; i++) {
      const collisions = maxEntitiesGrid.checkCollisions(i);
      assert.ok(collisions[0] >= 0, `Collision check for entity ${i} should succeed`);
    }

    assert.throws(
      () => {
        maxEntitiesGrid.addEntity(
          entityCount,
          Math.random() * randomOffset,
          Math.random() * randomOffset,
          Math.random() * randomOffset,
          10,
          10,
          10
        );
      },
      Error,
      'Adding more than max entities should throw an error'
    );
  });

  test('Grid Boundary Conditions', () => {
    const grid = new GridAABB(16, 1000);

    // Test entities with overlapping boundaries across chunk edges
    grid.addEntity(1, 0, 0, 0, 32, 32, 32); // Spans multiple chunks
    grid.addEntity(2, 16, 16, 16, 32, 32, 32); // Overlaps with first entity
    grid.addEntity(3, 100, 100, 100, 10, 10, 10); // Far away entity

    // Check collisions for first two entities
    const collisions1 = grid.checkCollisions(1);
    assert.strictEqual(collisions1[0], 1, 'Entities with overlapping boundaries should collide');
    assert.strictEqual(collisions1.at(-1), 2, 'Collision should be with entity 2');

    // Check third entity has no collisions
    const collisions3 = grid.checkCollisions(3);
    assert.strictEqual(collisions3[0], 0, 'Far away entity should have no collisions');
  });

  test('Grid Boundary Complex Conditions', () => {
    // Scenario 1: Entities exactly touching
    const touchingGrid = new GridAABB(16, 1000);
    touchingGrid.addEntity(1, 0, 0, 0, 10, 10, 10);
    touchingGrid.addEntity(2, 10, 10, 10, 10, 10, 10);

    const touchingCollisions1 = touchingGrid.checkCollisions(1);
    assert.strictEqual(touchingCollisions1[0], 1, 'Exactly touching entities should collide');
    assert.strictEqual(touchingCollisions1.at(-1), 2, 'Collision should be with entity 2');

    const touchingCollisions2 = touchingGrid.checkCollisions(2);
    assert.strictEqual(touchingCollisions2[0], 1, 'Exactly touching entities should collide');
    assert.strictEqual(touchingCollisions2.at(-1), 1, 'Collision should be with entity 1');

    // Scenario 2: Partially overlapping entities
    const overlappingGrid = new GridAABB(16, 1000);
    overlappingGrid.addEntity(3, 0, 0, 0, 20, 20, 20);
    overlappingGrid.addEntity(4, 10, 10, 10, 20, 20, 20);

    const overlapCollisions3 = overlappingGrid.checkCollisions(3);
    assert.strictEqual(overlapCollisions3[0], 1, 'Overlapping entities should collide');
    assert.strictEqual(overlapCollisions3.at(-1), 4, 'Collision should be with entity 4');

    // Scenario 3: Entities just missing collision
    const separatedGrid = new GridAABB(16, 1000);
    separatedGrid.addEntity(5, 0, 0, 0, 10, 10, 10);
    separatedGrid.addEntity(6, 11, 11, 11, 10, 10, 10);

    const separatedCollisions5 = separatedGrid.checkCollisions(5);
    assert.strictEqual(separatedCollisions5[0], 0, 'Separated entities should not collide');

    // Scenario 4: Large entities across multiple chunks
    const largeGrid = new GridAABB(16, 1000);
    largeGrid.addEntity(7, 0, 0, 0, 100, 100, 100);
    largeGrid.addEntity(8, 50, 50, 50, 100, 100, 100);

    const largeCollisions7 = largeGrid.checkCollisions(7);
    assert.strictEqual(largeCollisions7[0], 1, 'Large overlapping entities should collide');
    assert.strictEqual(largeCollisions7.at(-1), 8, 'Collision should be with entity 8');

    // Scenario 5: Extreme size difference
    const sizeDiffGrid = new GridAABB(16, 1000);
    sizeDiffGrid.addEntity(9, 0, 0, 0, 1000, 1000, 1000);
    sizeDiffGrid.addEntity(10, 10, 10, 10, 1, 1, 1);

    const sizeDiffCollisions9 = sizeDiffGrid.checkCollisions(9);
    assert.strictEqual(sizeDiffCollisions9[0], 1, 'Large entity should collide with small entity');
    assert.strictEqual(sizeDiffCollisions9.at(-1), 10, 'Collision should be with small entity');
  });
});

describe('Grid OBB in-house', () => {
  const runPerformanceTests = (entityCount = 100000) => {
    const grid = new GridOBBInHouse();

    const RandomArray1 = new Float32Array(entityCount * 3).map(() => Math.random() * 1000);
    const RandomArray2 = new Float32Array(entityCount * 3).map(() => Math.random() * 1000);

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        console.debug(`[${entry.name}] Duration: ${entry.duration.toFixed(2)}ms`);
      });
    });
    observer.observe({entryTypes: ['measure']});

    const identityMatrix = new Matrix4().identity();

    performance.mark('addEntities-start');
    for (let i = 0; i < entityCount; i++) {
      const id = i;
      const x = RandomArray1[i];
      const y = RandomArray1[i + 1];
      const z = RandomArray1[i + 2];
      const boundX = 10;
      const boundY = 10;
      const boundZ = 10;
      grid.addEntity(id, x, y, z, boundX, boundY, boundZ, identityMatrix);
    }
    performance.mark('addEntities-end');
    performance.measure('Add Entities', 'addEntities-start', 'addEntities-end');

    performance.mark('updateEntities-start');
    for (let i = 0; i < entityCount; i++) {
      const x = RandomArray2[i];
      const y = RandomArray2[i + 1];
      const z = RandomArray2[i + 2];
      grid.updateEntity(i, x, y, z);
    }
    performance.mark('updateEntities-end');
    performance.measure('Update Entities', 'updateEntities-start', 'updateEntities-end');

    performance.mark('checkCollisions-start');
    for (let i = 0; i < entityCount; i++) {
      grid.checkCollisions(i);
    }
    performance.mark('checkCollisions-end');
    performance.measure('Check Collisions', 'checkCollisions-start', 'checkCollisions-end');

    performance.clearMarks();
    performance.clearMeasures();
  };

  test('runPerformanceTests', () => {
    runPerformanceTests();
  });

  test('runPerformanceTests 500000', () => {
    runPerformanceTests(500000);
  });

  const identityMatrix = new Matrix4().identity();

  test('Grid Add Entity', () => {
    const grid = new GridOBBInHouse();

    grid.addEntity(99, 100000, 100000, 100000, 5, 5, 5, identityMatrix);

    grid.addEntity(111, 100005, 100005, 100005, 10, 10, 10, identityMatrix);

    grid.addEntity(666, 100002, 100002, 100002, 10, 10, 10, identityMatrix);

    assert.strictEqual(grid.checkCollisions(99)[0], 2, 'Entity 99 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(111)[0], 2, 'Entity 111 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(666)[0], 2, 'Entity 666 should have 2 collisions');

    assert.strictEqual(grid.checkCollisions(99).at(-1), 666, 'Entity 99 should collide with 666');
    assert.strictEqual(grid.checkCollisions(99).at(-2), 111, 'Entity 99 should collide with 111');

    assert.strictEqual(grid.checkCollisions(111).at(-1), 666, 'Entity 111 should collide with 666');
    assert.strictEqual(grid.checkCollisions(111).at(-2), 99, 'Entity 111 should collide with 99');

    assert.strictEqual(grid.checkCollisions(666).at(-1), 111, 'Entity 666 should collide with 111');
    assert.strictEqual(grid.checkCollisions(666).at(-2), 99, 'Entity 666 should collide with 99');
  });

  test('Grid Update Entity - Found Positive', () => {
    const grid = new GridOBBInHouse();

    grid.addEntity(99, -32, -32, -32, 5, 5, 5, identityMatrix);

    grid.addEntity(111, 5, 5, 5, 10, 10, 10, identityMatrix);

    grid.addEntity(666, 2, 2, 2, 10, 10, 10, identityMatrix);

    grid.updateEntity(99, 1, 1, 1);

    assert.strictEqual(grid.checkCollisions(99)[0], 2, 'Entity 99 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(111)[0], 2, 'Entity 111 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(666)[0], 2, 'Entity 666 should have 2 collisions');

    assert.strictEqual(
      grid.checkCollisions(99).indexOf(666),
      127,
      'Entity 99 should collide with 666'
    );
    assert.strictEqual(
      grid.checkCollisions(99).indexOf(111),
      119,
      'Entity 99 should collide with 111'
    );

    assert.strictEqual(grid.checkCollisions(111).at(-1), 666, 'Entity 111 should collide with 666');
    assert.strictEqual(grid.checkCollisions(111).at(-2), 99, 'Entity 111 should collide with 99');

    assert.strictEqual(grid.checkCollisions(666).at(-1), 111, 'Entity 666 should collide with 111');
    assert.strictEqual(grid.checkCollisions(666).at(-2), 99, 'Entity 666 should collide with 99');
  });

  test('Grid Update Entity - Found Negative', () => {
    const grid = new GridOBBInHouse();

    grid.addEntity(99, -32, -32, -32, 2, 2, 2, identityMatrix);

    grid.addEntity(111, 5, 5, 5, 10, 10, 10, identityMatrix);

    grid.addEntity(666, 2, 2, 2, 10, 10, 10, identityMatrix);

    grid.updateEntity(99, 1, 1, 1);
    grid.updateEntity(99, 100000, 100000, 100000);

    assert.strictEqual(grid.checkCollisions(99)[0], 0, 'Entity 99 should have 0 collisions');
    assert.strictEqual(grid.checkCollisions(111)[0], 1, 'Entity 111 should have 1 collisions');
    assert.strictEqual(grid.checkCollisions(666)[0], 1, 'Entity 666 should have 1 collisions');

    assert.strictEqual(grid.checkCollisions(99).at(-1), -1, 'Entity 99 should collide with no one');
    assert.strictEqual(grid.checkCollisions(99).at(-2), -1, 'Entity 99 should collide with no one');
  });

  test('Large Distance', () => {
    // Test extremely large distances
    const largeDistanceGrid = new GridOBBInHouse(1000); // Large cell size

    const largeCoords = [
      {id: 100, x: 1_000_000, y: 1_000_000, z: 1_000_000, bound: 1000},
      {id: 200, x: 1_000_010, y: 1_000_010, z: 1_000_010, bound: 1000},
      {id: 300, x: 10_000_000, y: 10_000_000, z: 10_000_000, bound: 10000},
    ];

    largeCoords.forEach(coord => {
      largeDistanceGrid.addEntity(
        coord.id,
        coord.x,
        coord.y,
        coord.z,
        coord.bound,
        coord.bound,
        coord.bound,
        identityMatrix
      );
    });

    const largeCollisions1 = largeDistanceGrid.checkCollisions(100);

    assert.strictEqual(largeCollisions1[0], 1, 'Entities very close should collide');
    assert.strictEqual(largeCollisions1.at(-1), 200, 'Collision with second large entity expected');

    const largeCollisions2 = largeDistanceGrid.checkCollisions(300);

    assert.strictEqual(largeCollisions2[0], 0, 'Far entities should not collide');
  });

  test('Grid Precision small', () => {
    const precisionGrid = new GridOBBInHouse(0.1); // small cell size

    // Test Small entities

    precisionGrid.addEntity(1, 1, 1, 1, 0.1, 0.1, 0.1, identityMatrix);
    precisionGrid.addEntity(2, 1.1, 1.1, 1.1, 0.5, 0.5, 0.5, identityMatrix);

    const collisions = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions[0], 1, 'Add: Small entities should detect collision');
    assert.strictEqual(collisions.at(-1), 2, 'Add: Collision with second entity expected');

    precisionGrid.updateEntity(2, 1.2, 1.2, 1.2);

    const collisions2 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions2[0],
      1,
      'Update in bound range: Small entities should detect collision'
    );
    assert.strictEqual(
      collisions2.at(-1),
      2,
      'Update in bound range: Collision with second entity expected'
    );

    precisionGrid.updateEntity(2, 1.5, 1.5, 1.5);

    const collisions3 = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions3[0], 0, 'Update out of bound range: Entities should not collide');

    precisionGrid.updateEntity(2, 1.1, 1.1, 1.1);

    const collisions4 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions4[0],
      1,
      'Update back in bound range: Small entities should detect collision'
    );
    assert.strictEqual(
      collisions4.at(-1),
      2,
      'Update back in bound range: Collision with second entity expected'
    );
  });

  test('Grid Precision tiny', () => {
    // Test extremely precise positioning
    const precisionGrid = new GridOBBInHouse(0.001); // Tiny cell size

    // Test very small entities
    precisionGrid.addEntity(1, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, identityMatrix);
    precisionGrid.addEntity(2, 0.0011, 0.0011, 0.0011, 0.001, 0.001, 0.001, identityMatrix);
    const collisions = precisionGrid.checkCollisions(1);
    assert.strictEqual(collisions[0], 1, 'Tiny entities should detect collision');
    assert.strictEqual(collisions.at(-1), 2, 'Collision with second entity expected');

    precisionGrid.updateEntity(2, 0.0012, 0.0012, 0.0012);

    const collisions2 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions2[0],
      1,
      'Update in bound range: Tiny entities should detect collision'
    );
    assert.strictEqual(
      collisions2.at(-1),
      2,
      'Update in bound range: Collision with second entity expected'
    );

    precisionGrid.updateEntity(2, 0.002, 0.002, 0.002);

    const collisions3 = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions3[0], 1, 'Update to bound range: Entities should collide');
    assert.strictEqual(
      collisions3.at(-1),
      2,
      'Update to bound range: Collision with second entity'
    );

    precisionGrid.updateEntity(2, 0.0021, 0.0021, 0.0021);

    const collisions4 = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions4[0], 0, 'Update out of bound range: Entities should not collide');
    assert.strictEqual(collisions4.at(-1), -1, 'Update out of bound range: No collision expected');

    precisionGrid.updateEntity(2, 0.0011, 0.0011, 0.0011);

    const collisions5 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions5[0],
      1,
      'Update back in bound range: Tiny entities should detect collision'
    );
    assert.strictEqual(
      collisions5.at(-1),
      2,
      'Update back in bound range: Collision with second entity expected'
    );
  });

  test('Grid Stress and Limit Tests', () => {
    // Test maximum entity capacity
    const maxEntitiesGrid = new GridOBBInHouse(16, 500_000);

    // Generate maximum number of entities
    const entityCount = 500_000;
    const randomOffset = 1000;

    for (let i = 0; i < entityCount; i++) {
      maxEntitiesGrid.addEntity(
        i,
        Math.random() * randomOffset,
        Math.random() * randomOffset,
        Math.random() * randomOffset,
        10,
        10,
        10,
        identityMatrix
      );
    }

    for (let i = 0; i < entityCount; i++) {
      const collisions = maxEntitiesGrid.checkCollisions(i);
      assert.ok(collisions[0] >= 0, `Collision check for entity ${i} should succeed`);
    }

    assert.throws(
      () => {
        maxEntitiesGrid.addEntity(
          entityCount,
          Math.random() * randomOffset,
          Math.random() * randomOffset,
          Math.random() * randomOffset,
          10,
          10,
          10,
          identityMatrix
        );
      },
      Error,
      'Adding more than max entities should throw an error'
    );
  });

  test('Grid Boundary Conditions', () => {
    const grid = new GridOBBInHouse(16, 1000);

    // Test entities with overlapping boundaries across chunk edges
    grid.addEntity(1, 0, 0, 0, 32, 32, 32, identityMatrix); // Spans multiple chunks
    grid.addEntity(2, 16, 16, 16, 32, 32, 32, identityMatrix); // Overlaps with first entity
    grid.addEntity(3, 100, 100, 100, 10, 10, 10, identityMatrix); // Far away entity

    // Check collisions for first two entities
    const collisions1 = grid.checkCollisions(1);
    assert.strictEqual(collisions1[0], 1, 'Entities with overlapping boundaries should collide');
    assert.strictEqual(collisions1.at(-1), 2, 'Collision should be with entity 2');

    // Check third entity has no collisions
    const collisions3 = grid.checkCollisions(3);
    assert.strictEqual(collisions3[0], 0, 'Far away entity should have no collisions');
  });

  test('Grid Boundary Complex Conditions', () => {
    // Scenario 1: Entities exactly touching
    const touchingGrid = new GridOBBInHouse(16, 1000);
    touchingGrid.addEntity(1, 0, 0, 0, 10, 10, 10, identityMatrix);
    touchingGrid.addEntity(2, 10, 10, 10, 10, 10, 10, identityMatrix);

    const touchingCollisions1 = touchingGrid.checkCollisions(1);
    assert.strictEqual(touchingCollisions1[0], 1, 'Exactly touching entities should collide');
    assert.strictEqual(touchingCollisions1.at(-1), 2, 'Collision should be with entity 2');

    const touchingCollisions2 = touchingGrid.checkCollisions(2);
    assert.strictEqual(touchingCollisions2[0], 1, 'Exactly touching entities should collide');
    assert.strictEqual(touchingCollisions2.at(-1), 1, 'Collision should be with entity 1');

    // Scenario 2: Partially overlapping entities
    const overlappingGrid = new GridAABB(16, 1000);
    overlappingGrid.addEntity(3, 0, 0, 0, 20, 20, 20);
    overlappingGrid.addEntity(4, 10, 10, 10, 20, 20, 20);

    const overlapCollisions3 = overlappingGrid.checkCollisions(3);
    assert.strictEqual(overlapCollisions3[0], 1, 'Overlapping entities should collide');
    assert.strictEqual(overlapCollisions3.at(-1), 4, 'Collision should be with entity 4');

    // Scenario 3: Entities just missing collision
    const separatedGrid = new GridAABB(16, 1000);
    separatedGrid.addEntity(5, 0, 0, 0, 10, 10, 10);
    separatedGrid.addEntity(6, 11, 11, 11, 10, 10, 10);

    const separatedCollisions5 = separatedGrid.checkCollisions(5);
    assert.strictEqual(separatedCollisions5[0], 0, 'Separated entities should not collide');

    // Scenario 4: Large entities across multiple chunks
    const largeGrid = new GridAABB(16, 1000);
    largeGrid.addEntity(7, 0, 0, 0, 100, 100, 100);
    largeGrid.addEntity(8, 50, 50, 50, 100, 100, 100);

    const largeCollisions7 = largeGrid.checkCollisions(7);
    assert.strictEqual(largeCollisions7[0], 1, 'Large overlapping entities should collide');
    assert.strictEqual(largeCollisions7.at(-1), 8, 'Collision should be with entity 8');

    // Scenario 5: Extreme size difference
    const sizeDiffGrid = new GridAABB(16, 1000);
    sizeDiffGrid.addEntity(9, 0, 0, 0, 1000, 1000, 1000);
    sizeDiffGrid.addEntity(10, 10, 10, 10, 1, 1, 1);

    const sizeDiffCollisions9 = sizeDiffGrid.checkCollisions(9);
    assert.strictEqual(sizeDiffCollisions9[0], 1, 'Large entity should collide with small entity');
    assert.strictEqual(sizeDiffCollisions9.at(-1), 10, 'Collision should be with small entity');
  });
});

describe('Grid OBB Three.js', () => {
  test('runPerformanceTests', () => {
    const runPerformanceTests = (entityCount = 100000) => {
      const grid = new GridOBBThreeJS();

      const RandomArray1 = new Float32Array(entityCount * 3).map(() => Math.random() * 1000);
      const RandomArray2 = new Float32Array(entityCount * 3).map(() => Math.random() * 1000);

      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.debug(`[${entry.name}] Duration: ${entry.duration.toFixed(2)}ms`);
        });
      });
      observer.observe({entryTypes: ['measure']});

      const identityMatrix = new Matrix4().identity();

      performance.mark('addEntities-start');
      for (let i = 0; i < entityCount; i++) {
        const id = i;
        const x = RandomArray1[i];
        const y = RandomArray1[i + 1];
        const z = RandomArray1[i + 2];
        const boundX = 10;
        const boundY = 10;
        const boundZ = 10;
        grid.addEntity(id, x, y, z, boundX, boundY, boundZ, identityMatrix);
      }
      performance.mark('addEntities-end');
      performance.measure('Add Entities', 'addEntities-start', 'addEntities-end');

      performance.mark('updateEntities-start');
      for (let i = 0; i < entityCount; i++) {
        const x = RandomArray2[i];
        const y = RandomArray2[i + 1];
        const z = RandomArray2[i + 2];
        grid.updateEntity(i, x, y, z);
      }
      performance.mark('updateEntities-end');
      performance.measure('Update Entities', 'updateEntities-start', 'updateEntities-end');

      performance.mark('checkCollisions-start');
      for (let i = 0; i < entityCount; i++) {
        grid.checkCollisions(i);
      }
      performance.mark('checkCollisions-end');
      performance.measure('Check Collisions', 'checkCollisions-start', 'checkCollisions-end');

      performance.clearMarks();
      performance.clearMeasures();
    };

    runPerformanceTests();
  });

  const identityMatrix = new Matrix4().identity();

  test('Grid Add Entity', () => {
    const grid = new GridOBBThreeJS();

    grid.addEntity(99, 100000, 100000, 100000, 5, 5, 5, identityMatrix);

    grid.addEntity(111, 100005, 100005, 100005, 10, 10, 10, identityMatrix);

    grid.addEntity(666, 100002, 100002, 100002, 10, 10, 10, identityMatrix);

    assert.strictEqual(grid.checkCollisions(99)[0], 2, 'Entity 99 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(111)[0], 2, 'Entity 111 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(666)[0], 2, 'Entity 666 should have 2 collisions');

    assert.strictEqual(grid.checkCollisions(99).at(-1), 666, 'Entity 99 should collide with 666');
    assert.strictEqual(grid.checkCollisions(99).at(-2), 111, 'Entity 99 should collide with 111');

    assert.strictEqual(grid.checkCollisions(111).at(-1), 666, 'Entity 111 should collide with 666');
    assert.strictEqual(grid.checkCollisions(111).at(-2), 99, 'Entity 111 should collide with 99');

    assert.strictEqual(grid.checkCollisions(666).at(-1), 111, 'Entity 666 should collide with 111');
    assert.strictEqual(grid.checkCollisions(666).at(-2), 99, 'Entity 666 should collide with 99');
  });

  test('Grid Update Entity - Found Positive', () => {
    const grid = new GridOBBThreeJS();

    grid.addEntity(99, -32, -32, -32, 5, 5, 5, identityMatrix);

    grid.addEntity(111, 5, 5, 5, 10, 10, 10, identityMatrix);

    grid.addEntity(666, 2, 2, 2, 10, 10, 10, identityMatrix);

    grid.updateEntity(99, 1, 1, 1);

    assert.strictEqual(grid.checkCollisions(99)[0], 2, 'Entity 99 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(111)[0], 2, 'Entity 111 should have 2 collisions');
    assert.strictEqual(grid.checkCollisions(666)[0], 2, 'Entity 666 should have 2 collisions');

    assert.strictEqual(
      grid.checkCollisions(99).indexOf(666),
      127,
      'Entity 99 should collide with 666'
    );
    assert.strictEqual(
      grid.checkCollisions(99).indexOf(111),
      119,
      'Entity 99 should collide with 111'
    );

    assert.strictEqual(grid.checkCollisions(111).at(-1), 666, 'Entity 111 should collide with 666');
    assert.strictEqual(grid.checkCollisions(111).at(-2), 99, 'Entity 111 should collide with 99');

    assert.strictEqual(grid.checkCollisions(666).at(-1), 111, 'Entity 666 should collide with 111');
    assert.strictEqual(grid.checkCollisions(666).at(-2), 99, 'Entity 666 should collide with 99');
  });

  test('Grid Update Entity - Found Negative', () => {
    const grid = new GridOBBThreeJS();

    grid.addEntity(99, -32, -32, -32, 2, 2, 2, identityMatrix);

    grid.addEntity(111, 5, 5, 5, 10, 10, 10, identityMatrix);

    grid.addEntity(666, 2, 2, 2, 10, 10, 10, identityMatrix);

    grid.updateEntity(99, 1, 1, 1);
    grid.updateEntity(99, 100000, 100000, 100000);

    assert.strictEqual(grid.checkCollisions(99)[0], 0, 'Entity 99 should have 0 collisions');
    assert.strictEqual(grid.checkCollisions(111)[0], 1, 'Entity 111 should have 1 collisions');
    assert.strictEqual(grid.checkCollisions(666)[0], 1, 'Entity 666 should have 1 collisions');

    assert.strictEqual(grid.checkCollisions(99).at(-1), -1, 'Entity 99 should collide with no one');
    assert.strictEqual(grid.checkCollisions(99).at(-2), -1, 'Entity 99 should collide with no one');
  });

  test('Large Distance', () => {
    // Test extremely large distances
    const largeDistanceGrid = new GridOBBThreeJS(1000); // Large cell size

    const largeCoords = [
      {id: 100, x: 1_000_000, y: 1_000_000, z: 1_000_000, bound: 1000},
      {id: 200, x: 1_000_010, y: 1_000_010, z: 1_000_010, bound: 1000},
      {id: 300, x: 10_000_000, y: 10_000_000, z: 10_000_000, bound: 10000},
    ];

    largeCoords.forEach(coord => {
      largeDistanceGrid.addEntity(
        coord.id,
        coord.x,
        coord.y,
        coord.z,
        coord.bound,
        coord.bound,
        coord.bound,
        identityMatrix
      );
    });

    const largeCollisions1 = largeDistanceGrid.checkCollisions(100);

    assert.strictEqual(largeCollisions1[0], 1, 'Entities very close should collide');
    assert.strictEqual(largeCollisions1.at(-1), 200, 'Collision with second large entity expected');

    const largeCollisions2 = largeDistanceGrid.checkCollisions(300);

    assert.strictEqual(largeCollisions2[0], 0, 'Far entities should not collide');
  });

  test('Grid Precision small', () => {
    const precisionGrid = new GridOBBThreeJS(0.1); // small cell size

    // Test Small entities

    precisionGrid.addEntity(1, 1, 1, 1, 0.1, 0.1, 0.1, identityMatrix);
    precisionGrid.addEntity(2, 1.1, 1.1, 1.1, 0.5, 0.5, 0.5, identityMatrix);

    const collisions = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions[0], 1, 'Add: Small entities should detect collision');
    assert.strictEqual(collisions.at(-1), 2, 'Add: Collision with second entity expected');

    precisionGrid.updateEntity(2, 1.2, 1.2, 1.2);

    const collisions2 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions2[0],
      1,
      'Update in bound range: Small entities should detect collision'
    );
    assert.strictEqual(
      collisions2.at(-1),
      2,
      'Update in bound range: Collision with second entity expected'
    );

    precisionGrid.updateEntity(2, 1.5, 1.5, 1.5);

    const collisions3 = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions3[0], 0, 'Update out of bound range: Entities should not collide');

    precisionGrid.updateEntity(2, 1.1, 1.1, 1.1);

    const collisions4 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions4[0],
      1,
      'Update back in bound range: Small entities should detect collision'
    );
    assert.strictEqual(
      collisions4.at(-1),
      2,
      'Update back in bound range: Collision with second entity expected'
    );
  });

  test('Grid Precision tiny', () => {
    // Test extremely precise positioning
    const precisionGrid = new GridOBBThreeJS(0.001); // Tiny cell size

    // Test very small entities
    precisionGrid.addEntity(1, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, identityMatrix);
    precisionGrid.addEntity(2, 0.0011, 0.0011, 0.0011, 0.001, 0.001, 0.001, identityMatrix);
    const collisions = precisionGrid.checkCollisions(1);
    assert.strictEqual(collisions[0], 1, 'Tiny entities should detect collision');
    assert.strictEqual(collisions.at(-1), 2, 'Collision with second entity expected');

    precisionGrid.updateEntity(2, 0.0012, 0.0012, 0.0012);

    const collisions2 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions2[0],
      1,
      'Update in bound range: Tiny entities should detect collision'
    );
    assert.strictEqual(
      collisions2.at(-1),
      2,
      'Update in bound range: Collision with second entity expected'
    );

    precisionGrid.updateEntity(2, 0.002, 0.002, 0.002);

    const collisions3 = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions3[0], 1, 'Update to bound range: Entities should collide');
    assert.strictEqual(
      collisions3.at(-1),
      2,
      'Update to bound range: Collision with second entity'
    );

    precisionGrid.updateEntity(2, 0.0021, 0.0021, 0.0021);

    const collisions4 = precisionGrid.checkCollisions(1);

    assert.strictEqual(collisions4[0], 0, 'Update out of bound range: Entities should not collide');
    assert.strictEqual(collisions4.at(-1), -1, 'Update out of bound range: No collision expected');

    precisionGrid.updateEntity(2, 0.0011, 0.0011, 0.0011);

    const collisions5 = precisionGrid.checkCollisions(1);

    assert.strictEqual(
      collisions5[0],
      1,
      'Update back in bound range: Tiny entities should detect collision'
    );
    assert.strictEqual(
      collisions5.at(-1),
      2,
      'Update back in bound range: Collision with second entity expected'
    );
  });

  test('Grid Stress and Limit Tests', () => {
    // Test maximum entity capacity
    const maxEntitiesGrid = new GridOBBThreeJS(16, 500_000);

    // Generate maximum number of entities
    const entityCount = 500_000;
    const randomOffset = 1000;

    for (let i = 0; i < entityCount; i++) {
      maxEntitiesGrid.addEntity(
        i,
        Math.random() * randomOffset,
        Math.random() * randomOffset,
        Math.random() * randomOffset,
        10,
        10,
        10,
        identityMatrix
      );
    }

    for (let i = 0; i < entityCount; i++) {
      const collisions = maxEntitiesGrid.checkCollisions(i);
      assert.ok(collisions[0] >= 0, `Collision check for entity ${i} should succeed`);
    }

    assert.throws(
      () => {
        maxEntitiesGrid.addEntity(
          entityCount,
          Math.random() * randomOffset,
          Math.random() * randomOffset,
          Math.random() * randomOffset,
          10,
          10,
          10,
          identityMatrix
        );
      },
      Error,
      'Adding more than max entities should throw an error'
    );
  });

  test('Grid Boundary Conditions', () => {
    const grid = new GridOBBThreeJS(16, 1000);

    // Test entities with overlapping boundaries across chunk edges
    grid.addEntity(1, 0, 0, 0, 32, 32, 32, identityMatrix); // Spans multiple chunks
    grid.addEntity(2, 16, 16, 16, 32, 32, 32, identityMatrix); // Overlaps with first entity
    grid.addEntity(3, 100, 100, 100, 10, 10, 10, identityMatrix); // Far away entity

    // Check collisions for first two entities
    const collisions1 = grid.checkCollisions(1);
    assert.strictEqual(collisions1[0], 1, 'Entities with overlapping boundaries should collide');
    assert.strictEqual(collisions1.at(-1), 2, 'Collision should be with entity 2');

    // Check third entity has no collisions
    const collisions3 = grid.checkCollisions(3);
    assert.strictEqual(collisions3[0], 0, 'Far away entity should have no collisions');
  });

  test('Grid Boundary Complex Conditions', () => {
    // Scenario 1: Entities exactly touching
    const touchingGrid = new GridOBBThreeJS(16, 1000);
    touchingGrid.addEntity(1, 0, 0, 0, 10, 10, 10, identityMatrix);
    touchingGrid.addEntity(2, 10, 10, 10, 10, 10, 10, identityMatrix);

    const touchingCollisions1 = touchingGrid.checkCollisions(1);
    assert.strictEqual(touchingCollisions1[0], 1, 'Exactly touching entities should collide');
    assert.strictEqual(touchingCollisions1.at(-1), 2, 'Collision should be with entity 2');

    const touchingCollisions2 = touchingGrid.checkCollisions(2);
    assert.strictEqual(touchingCollisions2[0], 1, 'Exactly touching entities should collide');
    assert.strictEqual(touchingCollisions2.at(-1), 1, 'Collision should be with entity 1');

    // Scenario 2: Partially overlapping entities
    const overlappingGrid = new GridAABB(16, 1000);
    overlappingGrid.addEntity(3, 0, 0, 0, 20, 20, 20);
    overlappingGrid.addEntity(4, 10, 10, 10, 20, 20, 20);

    const overlapCollisions3 = overlappingGrid.checkCollisions(3);
    assert.strictEqual(overlapCollisions3[0], 1, 'Overlapping entities should collide');
    assert.strictEqual(overlapCollisions3.at(-1), 4, 'Collision should be with entity 4');

    // Scenario 3: Entities just missing collision
    const separatedGrid = new GridAABB(16, 1000);
    separatedGrid.addEntity(5, 0, 0, 0, 10, 10, 10);
    separatedGrid.addEntity(6, 11, 11, 11, 10, 10, 10);

    const separatedCollisions5 = separatedGrid.checkCollisions(5);
    assert.strictEqual(separatedCollisions5[0], 0, 'Separated entities should not collide');

    // Scenario 4: Large entities across multiple chunks
    const largeGrid = new GridAABB(16, 1000);
    largeGrid.addEntity(7, 0, 0, 0, 100, 100, 100);
    largeGrid.addEntity(8, 50, 50, 50, 100, 100, 100);

    const largeCollisions7 = largeGrid.checkCollisions(7);
    assert.strictEqual(largeCollisions7[0], 1, 'Large overlapping entities should collide');
    assert.strictEqual(largeCollisions7.at(-1), 8, 'Collision should be with entity 8');

    // Scenario 5: Extreme size difference
    const sizeDiffGrid = new GridAABB(16, 1000);
    sizeDiffGrid.addEntity(9, 0, 0, 0, 1000, 1000, 1000);
    sizeDiffGrid.addEntity(10, 10, 10, 10, 1, 1, 1);

    const sizeDiffCollisions9 = sizeDiffGrid.checkCollisions(9);
    assert.strictEqual(sizeDiffCollisions9[0], 1, 'Large entity should collide with small entity');
    assert.strictEqual(sizeDiffCollisions9.at(-1), 10, 'Collision should be with small entity');
  });
});

describe('Grid OBB Compare Three.js vs In-House', () => {
  const identityMatrix = new Matrix4().identity();

  test('Add Entity', () => {
    const gridThreeJS = new GridOBBThreeJS();
    const gridInHouse = new GridOBBInHouse();

    const diff = 5;

    const entityOne = {id: 1, x: 100000 - diff, y: 100000 - diff, z: 100000 - diff, bound: 5};
    const entityTwo = {id: 2, x: 100005, y: 100005, z: 100005, bound: 5};
    const entityThree = {id: 3, x: 100010, y: 100010, z: 100010, bound: 5};

    gridThreeJS.addEntity(
      entityOne.id,
      entityOne.x,
      entityOne.y,
      entityOne.z,
      entityOne.bound,
      entityOne.bound,
      entityOne.bound,
      identityMatrix
    );
    gridThreeJS.addEntity(
      entityTwo.id,
      entityTwo.x,
      entityTwo.y,
      entityTwo.z,
      entityTwo.bound,
      entityTwo.bound,
      entityTwo.bound,
      identityMatrix
    );
    gridThreeJS.addEntity(
      entityThree.id,
      entityThree.x,
      entityThree.y,
      entityThree.z,
      entityThree.bound,
      entityThree.bound,
      entityThree.bound,
      identityMatrix
    );

    gridInHouse.addEntity(
      entityOne.id,
      entityOne.x,
      entityOne.y,
      entityOne.z,
      entityOne.bound,
      entityOne.bound,
      entityOne.bound,
      identityMatrix
    );
    gridInHouse.addEntity(
      entityTwo.id,
      entityTwo.x,
      entityTwo.y,
      entityTwo.z,
      entityTwo.bound,
      entityTwo.bound,
      entityTwo.bound,
      identityMatrix
    );
    gridInHouse.addEntity(
      entityThree.id,
      entityThree.x,
      entityThree.y,
      entityThree.z,
      entityThree.bound,
      entityThree.bound,
      entityThree.bound,
      identityMatrix
    );

    assert.strictEqual(
      gridThreeJS.checkCollisions(entityOne.id)[0],
      gridInHouse.checkCollisions(entityOne.id)[0],
      'Entity 1 should have the same number of collisions'
    );

    console.debug(`ThreeJS: ${gridThreeJS.checkCollisions(entityOne.id)}`);
    console.debug(`InHouse: ${gridInHouse.checkCollisions(entityOne.id)}`);

    assert.strictEqual(
      gridThreeJS.checkCollisions(entityTwo.id)[0],
      gridInHouse.checkCollisions(entityTwo.id)[0],
      'Entity 2 should have the same number of collisions'
    );

    console.debug(`ThreeJS: ${gridThreeJS.checkCollisions(entityTwo.id)}`);
    console.debug(`InHouse: ${gridInHouse.checkCollisions(entityTwo.id)}`);
    assert.strictEqual(
      gridThreeJS.checkCollisions(entityThree.id)[0],
      gridInHouse.checkCollisions(entityThree.id)[0],
      'Entity 3 should have the same number of collisions'
    );

    console.debug(`ThreeJS: ${gridThreeJS.checkCollisions(entityThree.id)}`);
    console.debug(`InHouse: ${gridInHouse.checkCollisions(entityThree.id)}`);
  });

  test('Update Entity', () => {
    const gridThreeJS = new GridOBBThreeJS();
    const gridInHouse = new GridOBBInHouse();

    const entityOne = {id: 1, x: 100000, y: 100000, z: 100000, bound: 5};
    const entityTwo = {id: 2, x: 100005, y: 100005, z: 100005, bound: 10};
    const entityThree = {id: 3, x: 100002, y: 100002, z: 100002, bound: 10};

    gridThreeJS.addEntity(
      entityOne.id,
      entityOne.x,
      entityOne.y,
      entityOne.z,
      entityOne.bound,
      entityOne.bound,
      entityOne.bound,
      identityMatrix
    );
    gridThreeJS.addEntity(
      entityTwo.id,
      entityTwo.x,
      entityTwo.y,
      entityTwo.z,
      entityTwo.bound,
      entityTwo.bound,
      entityTwo.bound,
      identityMatrix
    );
    gridThreeJS.addEntity(
      entityThree.id,
      entityThree.x,
      entityThree.y,
      entityThree.z,
      entityThree.bound,
      entityThree.bound,
      entityThree.bound,
      identityMatrix
    );

    gridInHouse.addEntity(
      entityOne.id,
      entityOne.x,
      entityOne.y,
      entityOne.z,
      entityOne.bound,
      entityOne.bound,
      entityOne.bound,
      identityMatrix
    );
    gridInHouse.addEntity(
      entityTwo.id,
      entityTwo.x,
      entityTwo.y,
      entityTwo.z,
      entityTwo.bound,
      entityTwo.bound,
      entityTwo.bound,
      identityMatrix
    );
    gridInHouse.addEntity(
      entityThree.id,
      entityThree.x,
      entityThree.y,
      entityThree.z,
      entityThree.bound,
      entityThree.bound,
      entityThree.bound,
      identityMatrix
    );

    assert.strictEqual(
      gridThreeJS.checkCollisions(entityOne.id)[0],
      gridInHouse.checkCollisions(entityOne.id)[0],
      'Entity 1 should have the same number of collisions'
    );
    assert.strictEqual(
      gridThreeJS.checkCollisions(entityTwo.id)[0],
      gridInHouse.checkCollisions(entityTwo.id)[0],
      'Entity 2 should have the same number of collisions'
    );
    assert.strictEqual(
      gridThreeJS.checkCollisions(entityThree.id)[0],
      gridInHouse.checkCollisions(entityThree.id)[0],
      'Entity 3 should have the same number of collisions'
    );
  });
});
