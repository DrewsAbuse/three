import type {ExtractRecordValue, bitMasks} from '../components';

export * from './camera.ts';
export * from './movements';

export type RequiredComponents = readonly ExtractRecordValue<typeof bitMasks>[];
