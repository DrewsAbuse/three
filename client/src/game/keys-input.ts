export type ControlsValue = {
  axis1Forward: number;
  axis1Side: number;
  pageUp: boolean;
  pageDown: boolean;
  space: boolean;
  shift: boolean;
  backspace: boolean;
};

export type KeysInput = {
  keySetDown: Set<string>;
  keySetUpdateId: [number];
};

export const getKeysSet = (): KeysInput => {
  const keySetDown = new Set<string>();
  const keySetUpdateId: [number] = [0];

  const keyDown = (e: KeyboardEvent) => {
    if (e.repeat) {
      return;
    }
    keySetUpdateId[0] += 1;
    keySetDown.add(e.code);
  };

  const keyUp = (e: KeyboardEvent) => {
    if (keySetDown.delete(e.code)) {
      keySetUpdateId[0] += 1;
    }
  };

  document.addEventListener('keydown', keyDown);
  document.addEventListener('keyup', keyUp);

  return {keySetDown, keySetUpdateId};
};

export const getMousePosition = () => {
  const mousePosition = {x: 0, y: 0};

  const mouseMove = (e: MouseEvent) => {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
  };

  document.addEventListener('mousemove', mouseMove);

  return mousePosition;
};
