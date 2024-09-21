import {Vector3} from 'three';
import {SubSystem} from '../base.ts';

export class CubesMovementInputSystem extends SubSystem {
  previousDateMs: number = new Date().getTime();

  createRandomDirectionVector() {
    return new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
  }

  update({
    props: {dateMs, moveVelocity},
  }: {
    timeElapsedS: number;
    props: {
      dateMs: number;
      moveVelocity: Vector3;
    };
  }) {
    //Each 10 seconds change direction
    if (dateMs - this.previousDateMs > 10000) {
      console.log('change direction');

      this.previousDateMs = dateMs;
      moveVelocity.multiply(this.createRandomDirectionVector());
    }
  }
}
