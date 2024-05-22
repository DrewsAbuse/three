

//const requiredComponents = [bitMasks.mesh];

//
// export class GridSystem extends System {
// grid: SpatialHashGrid;
//
// constructor() {
//     super({requiredComponents});
//     this.grid = new SpatialHashGrid(100);
// }
//
// update({archetypePartition}: {archetypePartition: ArchetypePartition | undefined}) {
//     if (archetypePartition === undefined) {
//       return;
//     }
//
//     const lastEntityIndex = archetypePartition[partitionConstants.lastNotDeletedEntityIndex];
//     const componentsIndexes = archetypePartition[partitionConstants.componentsIndexesOffset];
//     const entityId = archetypePartition[partitionConstants.entityStartOffset];
//     const entityLength = archetypePartition[partitionConstants.entityLengthOffset];
//     const meshComponentOffset = componentsIndexes[bitMasks.mesh];
//
//     for (let i = partitionConstants.entityLengthOffset; i < lastEntityIndex; i += entityLength) {
//       const mesh = archetypePartition[i + meshComponentOffset] as BitMaskToTypes[BitMasks['mesh']];
//       this.grid.addObject(mesh.position.x, mesh.position.y, mesh.position.z, entityId);
//     }
// }
//
// getGrid() {
//     return this.grid;
// }
// }
//
//
//
