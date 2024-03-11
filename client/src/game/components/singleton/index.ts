import {Component, bitMasks} from '../component.ts';

export type KeysInput = {
  keyDownToBoolMap: Map<string, boolean>;
  keySetUpdateId: [number];
};

const keysInput = ((): KeysInput => {
  const keyDownToBoolMap = new Map<string, boolean>();
  const keySetUpdateId: [number] = [0];

  const keyDown = (e: KeyboardEvent) => {
    if (e.repeat) {
      return;
    }
    keySetUpdateId[0] += 1;
    keyDownToBoolMap.set(e.code, true);
  };

  const keyUp = (e: KeyboardEvent) => {
    keyDownToBoolMap.set(e.code, false);
  };

  document.addEventListener('keydown', keyDown);
  document.addEventListener('keyup', keyUp);

  return {keyDownToBoolMap, keySetUpdateId};
})();

export const keysInputComponent = new Component({
  bitMask: bitMasks.keysInput,
  data: keysInput,
});

export const getMousePosition = () => {
  const mousePosition = {x: 0, y: 0};

  const mouseMove = (e: MouseEvent) => {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
  };

  document.addEventListener('mousemove', mouseMove);

  return mousePosition;
};
