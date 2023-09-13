import { kv } from '@vercel/kv';
import { LinkData } from '@/types';
import { Storage } from '@/libs/storage/index';
import { tryParseJson } from '@/utils/json-parser';
import { isDefined } from '@/utils/type-helper';

const APP_KEY = 'links:';

export default class KvStorage implements Storage {
  async getAll() {
    const keys = await kv.keys(APP_KEY + '*');
    if (keys.length === 0) {
      return [];
    }
    const list = await kv.mget(...keys);

    return list
      .map((data, idx) => {
        const parsed = tryParseJson<LinkData>(data);
        if (parsed) {
          return { key: keys[idx].replace(APP_KEY, ''), ...parsed };
        }
      })
      .filter(isDefined);
  }

  async get(key: string) {
    const result = await kv.get(APP_KEY + key);
    if (typeof result === 'string') {
      try {
        return JSON.parse(result) as LinkData;
      } catch (e) {}
    }
  }

  async set(key: string, data: LinkData) {
    await kv.set(APP_KEY + key, JSON.stringify(data));
  }
}
