// Crypto polyfill for Node.js 18 compatibility with TypeORM
import * as nodeCrypto from 'crypto';

// Ensure crypto.randomUUID is available globally
if (!(global as any).crypto) {
  (global as any).crypto = {
    randomUUID: nodeCrypto.randomUUID || (() => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }),
    webcrypto: (nodeCrypto as any).webcrypto
  };
}

// Also make it available directly
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = (global as any).crypto;
}