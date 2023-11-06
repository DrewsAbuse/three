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
import {ClientWorld, createRandomRadiusCircleOrbit} from './ecs.ts';

const renderer = new WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 1500);

//handle window resize

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
});

const scene = new Scene();

const material2 = new MeshBasicMaterial({color: 0x0000ff, wireframe: true});
const mesh2 = new Mesh(new BoxGeometry(1, 1, 1), material2);
const light = new AmbientLight(0x404040); // soft white light
const axesHelper = new AxesHelper(5);
const axesHelper2 = new AxesHelper(5);

const cube = new BoxGeometry(1, 1, 1);
const material = new MeshBasicMaterial({color: 0x00ff00, wireframe: true});
const mesh = new Mesh(cube, material);

mesh.rotation.y = -2;
camera.rotation.y = -2;

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
  data: new Vector3(100, 0.5, 0),
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

  mesh.position.x = Math.random() * 800;
  mesh.position.y = Math.random() * 100;
  mesh.position.z = Math.random() * 100;

  return mesh;
};

const world = new ClientWorld({renderer, scene, camera});

world.requestAnimationFrameWithElapsedTime();

//create 1000 cubes

console.time('create 10000 cubes');
for (let i = 0; i < 5000; i++) {
  const cube = createCube();
  const radius = createRandomRadiusCircleOrbit();

  world.createEntityAndAddToScene([
    new Component({data: radius, bitMask: componentTypeToBitMask.radius}),
    new Component({data: cube, bitMask: componentTypeToBitMask.mesh}),
  ]);
}
console.timeEnd('create 10000 cubes');

world.createEntityAndAddToScene([
  keysComponent,
  meshComponent,
  velocityComponent,
  deccelerationComponent,
  accelerationComponent,
]);

console.log(world.mapComponentsMaskToArchetype);
