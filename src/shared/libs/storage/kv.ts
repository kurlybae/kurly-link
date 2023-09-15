import { kv } from '@vercel/kv';
import { LinkData } from '@/types';
import { Storage } from '@/shared/libs/storage/index';

const APP_KEY = 'links:';

export default class KvStorage implements Storage {
  async getAll(key?: string[]) {
    const keys = key ?? (await kv.keys(APP_KEY + '*'));
    if (keys.length === 0) {
      return [];
    }
    return kv.mget<LinkData[]>(...keys);
  }

  async get(key: string) {
    return kv.get<LinkData>(APP_KEY + key).then((x) => x ?? undefined);
  }

  async set(key: string, data: LinkData) {
    const px = data.expireDate - data.registerDate;
    await kv.set(APP_KEY + key, data, { px });
  }

  async delete(key: string | string[]) {
    const target = key instanceof Array ? key : [key];
    await Promise.all(target.map((x) => kv.del(APP_KEY + x)));
  }
}
