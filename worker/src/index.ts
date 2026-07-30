import dotenv from 'dotenv';

dotenv.config();

console.log('CodeGuard AI Worker started...');
console.log(`------------------------------------------------------------`)

// Prevent the worker from exiting immediately
setInterval(() => {
  // worker processing loop simulator
}, 1000 * 60 * 60);
