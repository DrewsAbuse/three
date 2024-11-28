export const CLIENT = {
  SYSTEM_STEP: 0.03,
  FIXED_TIME_STEP: 16.67,
} as const;
export const GRID = {
  GRID_SIZE: 500,
  GRID_DIVISIONS: 10,
} as const;
export const ENTITIES = ['player'] as const;
export const VOXEL = {
  SIZE: 1,
} as const;

export const LOADER = {
  MODEL_PATH_ROOT: 'models',
  TEXTURE_PATH_ROOT: 'textures',
  MODEL_FOR_VOXELIZATION_PATH_ROOT: 'models-for-voxelization',
  VOXELIZED_MODEL_PATH_ROOT: 'voxelized-models',
} as const;

export const PLAYER = {
  MOVE: {
    MOVE_ACCELERATION: {
      x: 0,
      y: 0,
      z: 3,
    },
    MOVE_DECELERATION: {
      x: 0,
      y: 0,
      z: -3,
    },
    ROTATION_ACCELERATION: {
      x: 2,
      y: 1,
      z: 4,
    },
    ROTATION_DECELERATION: {
      x: -3,
      y: -2,
      z: -10,
    },
  },
};
