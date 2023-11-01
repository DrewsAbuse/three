export const clamp = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b);
export const negativeClamp = (x: number, a: number, b: number) => -Math.min(Math.max(x, a), b);
export const getAutoIncrementIdGenerator = () => {
  let id = 0;

  return () => ++id;
};
