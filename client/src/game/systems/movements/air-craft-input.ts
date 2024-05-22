import {Quaternion, Vector3} from 'three';
import type {Mesh} from 'three';
import type {RequiredComponents} from '../index.ts';
import type {KeysInput} from '../../components';
import {normalizedVec3} from '../../helpers';
import {System} from '../base.ts';

// This system is responsible for the movement like an air-craft.
export class AriCraftMovementSystem extends System {
  defaultKeysInputValues = {
    pitchInput: 0,
    yawInput: 0,
    rollInput: 0,
    spaceInput: 0,
    shiftInput: 0,
  };

  constructor(requiredComponents: RequiredComponents) {
    super({
      requiredComponents,
    });
  }

  frameDeceleration = new Vector3();
  quaternionContainer = new Quaternion();

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
      mesh,
      rotationVelocity,
      rotationAcceleration,
      rotationDeceleration,
      moveVelocity,
      moveAcceleration,
      moveDeceleration,
    },
  }: {
    timeElapsedS: number;
    props: {
      keyDownToBoolMap: KeysInput['keyDownToBoolMap'];
      mesh: Mesh;
      rotationVelocity: Vector3;
      rotationAcceleration: Vector3;
      rotationDeceleration: Vector3;
      moveVelocity: Vector3;
      moveAcceleration: Vector3;
      moveDeceleration: Vector3;
    };
  }) {
    const input = this.getControlValue(keyDownToBoolMap);

    //Rotation
    this.frameDeceleration.set(
      rotationVelocity.x * rotationDeceleration.x * timeElapsedS,
      rotationVelocity.y * rotationDeceleration.y * timeElapsedS,
      rotationVelocity.z * rotationDeceleration.z * timeElapsedS
    );
    //const alphaT = 1.0 - Math.pow(0.5, timeElapsedS * 10);
    rotationVelocity.add(this.frameDeceleration);

    if (input.pitchInput) {
      rotationVelocity.x += rotationAcceleration.x * input.pitchInput * timeElapsedS;
    }

    this.quaternionContainer.setFromAxisAngle(
      normalizedVec3.normalizedVector3X,
      Math.PI * rotationVelocity.x * timeElapsedS
    );
    mesh.quaternion.multiply(this.quaternionContainer);

    if (input.rollInput) {
      rotationVelocity.z += rotationAcceleration.z * input.rollInput * timeElapsedS;
    }

    this.quaternionContainer.setFromAxisAngle(
      normalizedVec3.normalizedVector3Z,
      Math.PI * rotationVelocity.z * timeElapsedS
    );
    mesh.quaternion.multiply(this.quaternionContainer);

    if (input.yawInput) {
      rotationVelocity.y += rotationAcceleration.y * input.yawInput * timeElapsedS;
    }

    this.quaternionContainer.setFromAxisAngle(
      normalizedVec3.normalizedVector3Y,
      Math.PI * rotationVelocity.y * timeElapsedS
    );
    mesh.quaternion.multiply(this.quaternionContainer);

    //Directional movement
    this.frameDeceleration.set(0, 0, moveVelocity.z * moveDeceleration.z * timeElapsedS);
    moveVelocity.add(this.frameDeceleration);

    if (input.spaceInput) {
      moveVelocity.z -= moveAcceleration.z * timeElapsedS;

      if (input.shiftInput) {
        moveVelocity.z -= 2 * moveAcceleration.z * timeElapsedS;
      }
    }
    mesh.position.add(moveVelocity.clone().applyQuaternion(mesh.quaternion));

    this.quaternionContainer.set(0, 0, 0, 1);
    this.frameDeceleration.set(0, 0, 0);
  }
}

//This system is responsible for handling pressing keys and set direction into the movement system. Split AriCraftMovementSystem into to separate systems.

export class AriCraftMovementInputSystem extends System {
  defaultKeysInputValues = {
    pitchInput: 0,
    yawInput: 0,
    rollInput: 0,
    spaceInput: 0,
    shiftInput: 0,
  };

  constructor(requiredComponents: RequiredComponents) {
    super({
      requiredComponents,
    });
  }

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
