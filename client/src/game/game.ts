import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import {Component, componentTypeToBitMask} from './component.ts';
import {ClientWorld} from './ecs.ts';

const renderer = new WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 1000);
const scene = new Scene();
const cube = new BoxGeometry(1, 1, 1);
const material = new MeshBasicMaterial({color: 0x00ff00, wireframe: true});
const mesh = new Mesh(cube, material);
const material2 = new MeshBasicMaterial({color: 0x0000ff, wireframe: true});
const mesh2 = new Mesh(new BoxGeometry(1, 1, 1), material2);
const light = new AmbientLight(0x404040); // soft white light
const axesHelper = new AxesHelper(5);
const axesHelper2 = new AxesHelper(5);

mesh.add(axesHelper);

scene.add(mesh);
scene.add(light);
scene.add(mesh2.add(axesHelper2));

const keysComponent = new Component({
  data: {
    axis1Forward: 0.0,
    axis1Side: 0.0,
    pageUp: false,
    pageDown: false,
    space: false,
    shift: false,
    backspace: false,
  },
  bitMask: componentTypeToBitMask.keys,
});
const meshComponent = new Component({
  data: mesh,
  bitMask: componentTypeToBitMask.mesh,
});
const accelerationComponent = new Component({
  data: new Vector3(100, 0.5, 25000),
  bitMask: componentTypeToBitMask.acceleration,
});
const deccelerationComponent = new Component({
  data: new Vector3(-0.00005, -0.0001, -1),
  bitMask: componentTypeToBitMask.decceleration,
});
const velocityComponent = new Component({
  data: new Vector3(0, 0, 0),
  bitMask: componentTypeToBitMask.velocity,
});

const createCube = () => {
  const cube = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({color: Math.random() * 0xffffff, wireframe: true});
  const mesh = new Mesh(cube, material);

  mesh.position.x = Math.random() * 200 - 5;
  mesh.position.y = Math.random() * 200 - 5;
  mesh.position.z = Math.random() * 200 - 5;

  return mesh;
};

const world = new ClientWorld({renderer, scene, camera});

//Create 1000 cubes

for (let i = 0; i < 1000; i++) {
  const cube = createCube();
  world.createEntityAndAddToScene([
    new Component({data: cube, bitMask: componentTypeToBitMask.mesh}),
  ]);
}

world.requestAnimationFrameWithElapsedTime();

world.createEntity([
  keysComponent,
  meshComponent,
  velocityComponent,
  deccelerationComponent,
  accelerationComponent,
]);
//
console.log(world.mapComponentsMaskToArchetype);
