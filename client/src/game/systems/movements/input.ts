import type {Vector3} from 'three';
import type {KeysInput} from '../../components';
import {SubSystem} from '../base.ts';

export class MovementInputSystem extends SubSystem {
  defaultKeysInputValues = {
    pitchInput: 0,
    yawInput: 0,
    rollInput: 0,
    spaceInput: 0,
    shiftInput: 0,
  };

  getControlValue(keyDownToBoolMap: KeysInput['keyDownToBoolMap']) {
    this.defaultKeysInputValues.spaceInput = keyDownToBoolMap.get('Space') ? 1 : 0;

    this.defaultKeysInputValues.shiftInput = keyDownToBoolMap.get('ShiftLeft') ? 1 : 0;

    // X - Axis rotation, nose up or tail up.
    this.defaultKeysInputValues.pitchInput = keyDownToBoolMap.get('KeyW') ? 1 : 0;
    this.defaultKeysInputValues.pitchInput += keyDownToBoolMap.get('KeyS') ? -1 : 0;

    // Y - Axis rotation, yaw left or yaw right.
    this.defaultKeysInputValues.yawInput = keyDownToBoolMap.get('KeyA') ? 1 : 0;
    this.defaultKeysInputValues.yawInput += keyDownToBoolMap.get('KeyD') ? -1 : 0;

    // Z - Axis rotation, roll left or roll right.
    this.defaultKeysInputValues.rollInput = keyDownToBoolMap.get('KeyE') ? -1 : 0;
    this.defaultKeysInputValues.rollInput += keyDownToBoolMap.get('KeyQ') ? 1 : 0;

    return this.defaultKeysInputValues;
  }

  update({
    timeElapsedS,
    props: {
      keyDownToBoolMap,
      rotationVelocity,
      rotationAcceleration,
      moveVelocity,
      moveAcceleration,
    },
  }: {
    timeElapsedS: number;
    props: {
      keyDownToBoolMap: KeysInput['keyDownToBoolMap'];
      rotationVelocity: Vector3;
      rotationAcceleration: Vector3;
      moveVelocity: Vector3;
      moveAcceleration: Vector3;
    };
  }) {
    const input = this.getControlValue(keyDownToBoolMap);

    if (input.pitchInput) {
      rotationVelocity.x += rotationAcceleration.x * input.pitchInput * timeElapsedS;
    }

    if (input.rollInput) {
      rotationVelocity.z += rotationAcceleration.z * input.rollInput * timeElapsedS;
    }

    if (input.yawInput) {
      rotationVelocity.y += rotationAcceleration.y * input.yawInput * timeElapsedS;
    }

    if (input.spaceInput) {
      moveVelocity.z -= moveAcceleration.z * timeElapsedS;

      if (input.shiftInput) {
        moveVelocity.z -= 2 * moveAcceleration.z * timeElapsedS;
      }
    }
  }
}
