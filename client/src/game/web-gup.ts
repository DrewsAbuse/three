import {WebGLRenderer} from 'three';

export class WebGPURenderer extends WebGLRenderer {
  context:
    | (WebGLRenderingContext & {
        // @ts-ignore
        gpu?: GPUDevice;
      })
    | (WebGL2RenderingContext & {
        // @ts-ignore
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
