import {createCubeTexture} from '../../game/helpers';
import px from './cube-map/px.png';
import nx from './cube-map/nx.png';
import py from './cube-map/py.png';
import ny from './cube-map/ny.png';
import pz from './cube-map/pz.png';
import nz from './cube-map/nz.png';

export const skybox = createCubeTexture(px, nx, py, ny, pz, nz);
