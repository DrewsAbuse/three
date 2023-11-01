import {CubeTextureLoader, SRGBColorSpace} from 'three';
import px from './assets/cube-map/px.png';
import nx from './assets/cube-map/nx.png';
import py from './assets/cube-map/py.png';
import ny from './assets/cube-map/ny.png';
import pz from './assets/cube-map/pz.png';
import nz from './assets/cube-map/nz.png';

export const createSkybox = () => {
  const loader = new CubeTextureLoader();
  const texture = loader.load([px, nx, py, ny, pz, nz]);
  texture.colorSpace = SRGBColorSpace;

  return texture;
};
