import {Color, Vector3} from 'three';

export const getAutoIncrementIdGenerator = () => {
  let id = -1;

  return () => ++id;
};
export const autoIncrementId = getAutoIncrementIdGenerator();
export const rainbowColors = [
  new Color(0xff0000),
  new Color(0xff7f00),
  new Color(0xffff00),
  new Color(0x00ff00),
  new Color(0x0000ff),
  new Color(0x4b0082),
  new Color(0x9400d3),
  new Color(0xff0000),
  new Color(0xff7f00),
  new Color(0xffff00),
  new Color(0x00ff00),
  new Color(0x0000ff),
  new Color(0x4b0082),
  new Color(0x9400d3),
  new Color(0xff0000),
  new Color(0xff7f00),
];
export const normalizedVec3 = {
  normalizedVector3X: new Vector3(1, 0, 0),
  normalizedVector3Y: new Vector3(0, 1, 0),
  normalizedVector3Z: new Vector3(0, 0, 1),
};

export const createMixinWithFunc = <T, S extends string>({
  some,
  func,
  key,
}: {
  some: T;
  func: () => void;
  key: S;
}): T & Record<S, () => void> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- hack
  // @ts-expect-error
  some[key] = func;

  return some as T & Record<S, () => void>;
};
