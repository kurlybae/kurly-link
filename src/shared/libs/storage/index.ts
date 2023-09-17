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

const db: Storage = process.env.REDIS_URL
  ? new RedisStorage()
  : process.env.KV_URL
  ? new KvStorage()
  : new MemoryStorage();

const tempMapper = <T extends LinkData | undefined>(input: T): T =>
  input
    ? {
        ...input,
        bridgeTemplate: input.bridgeTemplate ?? null,
        bridgeType:
          input.bridgeType ?? (input as any).appOnly ? 'app_only' : 'normal',
        appCall: input.appCall ?? 'always',
      }
    : input;

const storage: Storage = {
  getAll(key?: string[]): Promise<LinkData[]> {
    return db.getAll(key).then((x) => x.map(tempMapper));
  },
  get(key: string): Promise<LinkData | undefined> {
    return db.get(key).then(tempMapper);
  },
  set(key: string, data: LinkData): Promise<void> {
    return db.set(key, data);
  },
  delete(key: string | string[]): Promise<void> {
    return db.delete(key);
  },
};

export default storage;
