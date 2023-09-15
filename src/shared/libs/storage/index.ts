import { LinkData } from '@/types';
import KvStorage from './kv';
import RedisStorage from './redis';
import MemoryStorage from './memory';

export interface Storage {
  getAll(key?: string[]): Promise<LinkData[]>;

  get(key: string): Promise<LinkData | undefined>;

  set(key: string, data: LinkData): Promise<void>;

  delete(key: string | string[]): Promise<void>;
}

const storage: Storage = process.env.REDIS_URL
  ? new RedisStorage()
  : process.env.KV_URL
  ? new KvStorage()
  : new MemoryStorage();

export default storage;