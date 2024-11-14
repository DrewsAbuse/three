import {CubeTextureLoader, SRGBColorSpace} from 'three';

export const createCubeTexture = (...paths: string[]) => {
  const loader = new CubeTextureLoader();
  const texture = loader.load(paths);
  texture.colorSpace = SRGBColorSpace;

  return texture;
};
