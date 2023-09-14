import { kv } from '@vercel/kv';
import { LinkData } from '@/types';
import { Storage } from '@/libs/storage/index';

const APP_KEY = 'links:';

export default class KvStorage implements Storage {
  async getAll() {
    const keys = await kv.keys(APP_KEY + '*');
    if (keys.length === 0) {
      return [];
    }
    const list = await kv.mget<LinkData[]>(...keys);

    return list.map((data, idx) => ({
      key: keys[idx].replace(APP_KEY, ''),
      ...data,
    }));
  }

  async get(key: string) {
    return kv.get<LinkData>(APP_KEY + key).then((x) => x ?? undefined);
  }

  async set(key: string, data: LinkData) {
    await kv.set(APP_KEY + key, data, { ex: 10000 });
  }
}
