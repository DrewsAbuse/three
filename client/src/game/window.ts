import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  ConeGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import Stats from 'stats.js';

export const renderer = new WebGLRenderer();

const FOV = 100;
const ASPECT = window.innerWidth / window.innerHeight;
const NEAR = 0.2;
const FAR = 3000;

const sphereGeometry = new ConeGeometry(5, 10, 25);
const sphereMaterial = new MeshBasicMaterial({color: 0xff0000});
const sphereMesh = new Mesh(sphereGeometry, sphereMaterial);
sphereMesh.rotation.x = Math.PI / 2;

const cameraAxisHelper = new AxesHelper(-10);

export const camera = new PerspectiveCamera(FOV, ASPECT, NEAR, FAR);

camera.add(cameraAxisHelper);
camera.add(sphereMesh);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

export const light = new AmbientLight(0x404040);
export const scene = new Scene();
scene.add(light);

export const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom).style.position = 'absolute';

const boxGeometry = new BoxGeometry(20, 20, 20);
const boxMaterial = new MeshBasicMaterial({color: 0x00ff00, wireframe: true});
const boxMesh = new Mesh(boxGeometry, boxMaterial);

scene.add(boxMesh);
