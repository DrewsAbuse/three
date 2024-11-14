import {WebGLRenderer} from 'three';

export class WebGPURenderer extends WebGLRenderer {
  context:
    | (WebGLRenderingContext & {
        gpu?: GPUDevice;
      })
    | (WebGL2RenderingContext & {
        gpu?: GPUDevice;
      });

  constructor() {
    super();
    this.context = null as never;
    this.context = this.getContext();
  }

  async init() {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter?.requestDevice();

    if (!device) {
      throw new Error('WebGPURenderer - No device found');
    }

    this.context.gpu = device;
  }
}

const webGPURenderer = new WebGPURenderer();
await webGPURenderer.init();
export {webGPURenderer};
