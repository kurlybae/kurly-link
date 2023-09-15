import { LinkData } from '@/types';
import { Storage } from './index';

export default class MemoryStorage implements Storage {
  store: Map<string, LinkData>;

  constructor() {
    this.store = new Map();
  }

  async getAll(key?: string[]) {
    return Array.from(this.store.values()).filter(
      (x) => !key || key.includes(x.key),
    );
  }

  async get(key: string) {
    return this.store.get(key);
  }

  async set(key: string, data: LinkData) {
    const px = data.expireDate - data.registerDate;
    this.store.set(key, data);
    setTimeout(() => {
      this.store.delete(key);
    }, px);
  }

  async delete(key: string | string[]) {
    const target = key instanceof Array ? key : [key];
    target.forEach((x) => {
      this.store.delete(x);
    });
  }
}
