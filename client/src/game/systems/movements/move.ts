import {type Mesh, Quaternion, Vector3} from 'three';
import {SubSystem} from '../base.ts';
import {normalizedVec3} from '../../helpers';

export class MovementAndRotationSystem extends SubSystem {
  frameDeceleration = new Vector3();
  quaternionContainer = new Quaternion();

  update({
    timeElapsedS,
    props: {mesh, rotationVelocity, rotationDeceleration, moveVelocity, moveDeceleration},
  }: {
    timeElapsedS: number;
    props: {
      mesh: Mesh;
      rotationVelocity: Vector3;
      rotationDeceleration: Vector3;
      moveVelocity: Vector3;
      moveDeceleration: Vector3;
    };
  }) {
    //Rotation
    this.frameDeceleration.set(
      rotationVelocity.x * rotationDeceleration.x * timeElapsedS,
      rotationVelocity.y * rotationDeceleration.y * timeElapsedS,
      rotationVelocity.z * rotationDeceleration.z * timeElapsedS
    );
    //const alphaT = 1.0 - Math.pow(0.5, timeElapsedS * 10);
    rotationVelocity.add(this.frameDeceleration);

    this.quaternionContainer.setFromAxisAngle(
      normalizedVec3.normalizedVector3X,
      Math.PI * rotationVelocity.x * timeElapsedS
    );
    mesh.quaternion.multiply(this.quaternionContainer);

    this.quaternionContainer.setFromAxisAngle(
      normalizedVec3.normalizedVector3Z,
      Math.PI * rotationVelocity.z * timeElapsedS
    );
    mesh.quaternion.multiply(this.quaternionContainer);

    this.quaternionContainer.setFromAxisAngle(
      normalizedVec3.normalizedVector3Y,
      Math.PI * rotationVelocity.y * timeElapsedS
    );
    mesh.quaternion.multiply(this.quaternionContainer);

    //Directional movement
    this.frameDeceleration.set(0, 0, moveVelocity.z * moveDeceleration.z * timeElapsedS);
    moveVelocity.add(this.frameDeceleration);

    mesh.position.add(moveVelocity.clone().applyQuaternion(mesh.quaternion));

    this.quaternionContainer.set(0, 0, 0, 1);
    this.frameDeceleration.set(0, 0, 0);
  }
}
