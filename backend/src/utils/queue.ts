import { Queue } from 'bullmq';
import { redis } from './redis';

export const scanQueue = new Queue('scan-queue', {
  connection: redis,
});
