// A simple in-memory cache to replace Redis since we are running locally without it
const cache = new Map<string, { value: string; expiresAt: number }>();

export const redis = {
  get: async (key: string) => {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      cache.delete(key);
      return null;
    }
    return item.value;
  },
  set: async (key: string, value: string, mode?: string, durationSeconds?: number) => {
    const expiresAt = durationSeconds ? Date.now() + durationSeconds * 1000 : Infinity;
    cache.set(key, { value, expiresAt });
    return 'OK';
  },
  del: async (key: string) => {
    cache.delete(key);
    return 1;
  }
};

console.log('Successfully initialized in-memory cache (Redis disabled)');
