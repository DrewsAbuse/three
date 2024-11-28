import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import type {GLTF} from 'three/examples/jsm/loaders/GLTFLoader';
import {GLTFToVoxels} from '../../libs/@shared/helpers/models/gltf-to-voxels.ts';

type ViewerOptions = {
  kiosk?: boolean;
  model?: string;
  preset?: string;
  cameraPosition?: number[];
};

class Viewer {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private content: THREE.Object3D | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private animationFrame: number | null = null;

  private loadingManager!: THREE.LoadingManager;
  private dracoLoader!: DRACOLoader;
  private ktx2Loader!: KTX2Loader;

  constructor(
    private containerElement: HTMLElement,
    private options: ViewerOptions = {}
  ) {
    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initControls();
    this.initLoaders();
    this.setupLighting();
    this.setupResizeHandler();
  }

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.containerElement.clientWidth, this.containerElement.clientHeight);
    this.containerElement.appendChild(this.renderer.domElement);
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
  }

  private initCamera(): void {
    const {clientWidth, clientHeight} = this.containerElement;
    this.camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 1000);

    // Apply custom camera position if provided
    if (this.options.cameraPosition) {
      const [x, y, z] = this.options.cameraPosition;
      this.camera.position.set(x, y, z);
    } else {
      this.camera.position.set(0, 0, 5);
    }
  }

  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
  }

  private initLoaders(): void {
    this.loadingManager = new THREE.LoadingManager();

    // Configure Draco Loader
    this.dracoLoader = new DRACOLoader(this.loadingManager);
    this.dracoLoader.setDecoderPath('path/to/draco/');

    // Configure KTX2 Loader
    this.ktx2Loader = new KTX2Loader(this.loadingManager);
    this.ktx2Loader.setTranscoderPath('path/to/basis/');
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 0);
    this.scene.add(directionalLight);
  }

  private setupResizeHandler(): void {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const {width, height} = entry.contentRect;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(this.containerElement);
  }

  private animate(): void {
    this.animationFrame = requestAnimationFrame(() => this.animate());

    if (this.mixer) {
      const delta = new THREE.Clock().getDelta();
      this.mixer.update(delta);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public load(url: string, rootPath: string, assetMap?: Map<string, File>): Promise<GLTF> {
    const baseURL = THREE.LoaderUtils.extractUrlBase(url);
    const blobURLs: string[] = [];

    this.loadingManager.setURLModifier(originalURL => {
      const normalizedURL = rootPath + decodeURI(originalURL).replace(baseURL, '');
      console.log('Normalized URL:', normalizedURL); // Debugging line

      console.log('Asset Map:', assetMap); // Debugging line
      if (assetMap && assetMap.has(normalizedURL)) {
        const blob = assetMap.get(normalizedURL)!;
        const blobURL = URL.createObjectURL(blob);
        blobURLs.push(blobURL);

        return blobURL;
      }
      console.log('Using original URL:', originalURL); // Debugging line

      return originalURL;
    });

    const loader = new GLTFLoader(this.loadingManager)
      .setDRACOLoader(this.dracoLoader)
      .setKTX2Loader(this.ktx2Loader.detectSupport(this.renderer))
      .setMeshoptDecoder(MeshoptDecoder);

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        gltf => {
          const scene = gltf.scene || gltf.scenes[0];
          const clips = gltf.animations || [];

          if (!scene) {
            reject(new Error('Model contains no scene.'));

            return;
          }

          this.setContent(scene, clips);

          blobURLs.forEach(URL.revokeObjectURL);
          resolve(gltf);
        },
        undefined,
        error => {
          blobURLs.forEach(URL.revokeObjectURL);
          reject(error);
        }
      );
    });
  }
  /**
   * Sets the loaded GLTF content into the scene.
   */
  setContent(object: THREE.Object3D, clips: THREE.AnimationClip[]): void {
    this.clearContent();

    // Center and scale the model
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    this.controls.reset();

    // Adjust object position
    object.position.x -= center.x;
    object.position.y -= center.y;
    object.position.z -= center.z;

    // Adjust camera and controls
    this.controls.maxDistance = size * 1000;
    this.camera.near = size / 100;
    this.camera.far = size * 1000;
    this.camera.updateProjectionMatrix();

    // Add to scene
    this.scene.add(object);
    this.content = object;

    // Setup animations if present
    if (clips && clips.length > 0) {
      this.setupAnimations(clips);
    }

    // Start animation loop
    this.animate();
  }

  /**
   * Clears the current content from the scene.
   */
  public clear(): void {
    this.clearContent();

    // Cancel animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private clearContent(): void {
    if (this.content) {
      this.scene.remove(this.content);
      this.content = null;
    }

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
      this.mixer = null;
    }
  }

  /**
   * Sets up animations for the loaded content.
   */
  private setupAnimations(clips: THREE.AnimationClip[]): void {
    if (!this.content) {
      return;
    }

    this.mixer = new THREE.AnimationMixer(this.content);
    clips.forEach(clip => {
      this.mixer!.clipAction(clip).play();
    });
  }
}

type AppOptions = {
  kiosk?: boolean;
  model?: string;
  preset?: string;
  cameraPosition?: number[];
};

class App {
  private viewer: Viewer | null = null;
  private viewerEl: HTMLElement | null = null;
  private dropEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private options: AppOptions;
  private object3D!: THREE.Object3D;
  private gltfToVoxels: GLTFToVoxels;

  constructor(el: HTMLElement, location: Location) {
    const hash = location.hash ? this.parseHash(location.hash) : {};
    this.options = {
      kiosk: Boolean(hash.kiosk),
      model: hash.model || '',
      preset: hash.preset || '',
      cameraPosition: [50, 50, 50],
    };

    this.dropEl = el.querySelector('.dropzone') as HTMLElement;
    this.inputEl = el.querySelector('#file-input') as HTMLInputElement;

    this.checkBrowserCapabilities();
    this.createDropzone();

    if (this.options.kiosk) {
      const headerEl = document.querySelector('header') as HTMLElement;
      headerEl.style.display = 'none';
    }

    if (this.options.model) {
      this.view(this.options.model, '', new Map());
    }

    this.gltfToVoxels = new GLTFToVoxels();
  }

  private parseHash(hash: string): AppOptions {
    const params = new URLSearchParams(hash.replace('#', ''));
    const options: AppOptions = {};

    if (params.get('kiosk')) {
      options.kiosk = true;
    }

    if (params.get('model')) {
      options.model = params.get('model')!;
    }

    if (params.get('preset')) {
      options.preset = params.get('preset')!;
    }

    if (params.get('cameraPosition')) {
      options.cameraPosition = params.get('cameraPosition')!.split(',').map(Number);
    }

    return options;
  }

  private checkBrowserCapabilities(): void {
    if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
      console.error('The File APIs are not fully supported in this browser.');
    }

    if (!this.isWebGLAvailable()) {
      console.error('WebGL is not supported in this browser.');
    }
  }

  private isWebGLAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');

      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  private createButtonTransformToVoxels(): void {
    const button = document.createElement('button');
    button.textContent = 'Transform to Voxels';
    button.addEventListener('click', () => this.transformToVoxels());
    this.viewerEl!.appendChild(button);
  }

  private createDropzone(): void {
    this.inputEl.addEventListener('change', event => {
      const {files} = event.target as HTMLInputElement;

      if (files) {
        this.load(files);
      }
    });

    this.dropEl.addEventListener('dragover', event => {
      event.preventDefault();
      this.dropEl.classList.add('dragover');
    });

    this.dropEl.addEventListener('dragleave', () => {
      this.dropEl.classList.remove('dragover');
    });

    this.dropEl.addEventListener('drop', event => {
      event.preventDefault();
      this.dropEl.classList.remove('dragover');
      const files = event.dataTransfer?.files;

      if (files) {
        this.load(files);
      }
    });
  }

  private load(fileList: FileList): void {
    const fileMap = new Map(Array.from(fileList).map(file => [file.webkitRelativePath, file]));
    let rootFile: File | undefined;
    let rootPath = '';

    for (const [path, file] of fileMap.entries()) {
      if (file.name.match(/\.(gltf|glb)$/)) {
        rootFile = file;
        rootPath = path.replace(file.name, '');
        break;
      }
    }

    if (!rootFile) {
      this.onError('No .gltf or .glb asset found.');

      return;
    }

    this.view(rootFile, rootPath, fileMap);
  }

  private view(rootFile: File | string, rootPath: string, fileMap: Map<string, File>): void {
    if (this.viewer) {
      this.viewer.clear();
    }

    const viewer = this.viewer || this.createViewer();
    const fileURL = typeof rootFile === 'string' ? rootFile : URL.createObjectURL(rootFile);

    const cleanup = () => {
      if (typeof rootFile === 'object') {
        URL.revokeObjectURL(fileURL);
      }
    };

    viewer
      .load(fileURL, rootPath, fileMap)
      .then(gltf => {
        console.log('GLTF loaded:', gltf);
        gltf.scene.scale.set(10, 10, 10);

        this.object3D = gltf.scene;
        this.createButtonTransformToVoxels();
        cleanup();
      })
      .catch((e: Error) => this.onError(e));
  }

  private createViewer(): Viewer {
    this.viewerEl = document.getElementById('model-viewer') as HTMLElement;
    this.viewerEl.classList.add('viewer');
    this.dropEl.innerHTML = '';
    this.dropEl.appendChild(this.viewerEl);
    this.viewer = new Viewer(this.viewerEl, this.options);

    return this.viewer;
  }

  private onError(error: Error | string): void {
    let message = typeof error === 'string' ? error : error.message || error.toString();

    if (message.match(/ProgressEvent/)) {
      message = 'Unable to retrieve this file. Check JS console and browser network tab.';
    } else if (message.match(/Unexpected token/)) {
      message = `Unable to parse file content. Verify that this file is valid. Error: "${message}"`;
    }

    window.alert(message);
    console.error(error);
  }

  private transformToVoxels(): Promise<void> {
    return new Promise<void>(resolve => {
      this.gltfToVoxels.voxelizeModel(this.object3D);
      const voxels = this.gltfToVoxels.createVoxelMesh();

      const instancedMesh = this.gltfToVoxels.createInstancedMesh(voxels.mesh);

      this.viewer!.setContent(instancedMesh, []);

      console.log('Voxels:', voxels);
      resolve();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Create app instance
  const app = new App(document.body, location);

  (window as any).VIEWER = {app};
  console.info('[glTF Viewer] Debugging data exported as `window.VIEWER`.');
});
