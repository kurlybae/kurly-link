import { LinkData } from '@/types';
import { Storage } from './index';

export default class MemoryStorage implements Storage {
  store: Map<string, LinkData>;

  constructor() {
    this.store = new Map();
  }

  async getAll() {
    return Array.from(this.store.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }

  async get(key: string) {
    return this.store.get(key);
  }

  async set(key: string, data: LinkData) {
    this.store.set(key, data);
  }
}
