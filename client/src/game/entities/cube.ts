//Create new BOX entity

import {BoxGeometry, Mesh, MeshBasicMaterial, Vector3} from 'three';
import type {EntityInput} from '../types.ts';
import {Component, componentsId} from '../components';
import {autoIncrementId} from '../helpers';

//TODO: FIX MEMORY ALLOCATION - Too many arrays being created for components
export const createBox = (): EntityInput => {
  const boxGeometry = new BoxGeometry(10, 10, 10);
  const boxMaterial = new MeshBasicMaterial({color: 0x00ff00});
  const boxMesh = new Mesh(boxGeometry, boxMaterial);

  const meshComponent = new Component({
    data: boxMesh,
    id: componentsId.mesh,
  });
  const movementComponent = new Component({
    data: [
      'cube',
      new Vector3(),
      new Vector3(0, 0, 2),
      new Vector3(0, 0, -3),
      new Vector3(),
      new Vector3(2, 1, 4),
      new Vector3(-4, -3, -12),
    ],
    id: componentsId.movement,
  });

  const components = [meshComponent, movementComponent];
  const sortedComponents = components.sort((a, b) => a.id - b.id);

  return {
    componentsId: new Uint16Array(sortedComponents.map(component => component.id)),
    entityArray: [autoIncrementId(), 0, 0, ...sortedComponents.map(component => component.data)],
  };
};
