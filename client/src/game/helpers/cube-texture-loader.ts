import {CubeTextureLoader, SRGBColorSpace} from 'three';
import px from '../../assets/sky-box/cube-map/px.png';
import nx from '../../assets/sky-box/cube-map/nx.png';
import py from '../../assets/sky-box/cube-map/py.png';
import ny from '../../assets/sky-box/cube-map/ny.png';
import pz from '../../assets/sky-box/cube-map/pz.png';
import nz from '../../assets/sky-box/cube-map/nz.png';

export const createCubeTexture = (...paths: string[]) => {
  const loader = new CubeTextureLoader();
  const texture = loader.load(paths);
  texture.colorSpace = SRGBColorSpace;

  return texture;
};

export const skybox = createCubeTexture(px, nx, py, ny, pz, nz);
