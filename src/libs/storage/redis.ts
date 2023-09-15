import { createClient, RedisClientType } from 'redis';
import { LinkData } from '@/types';
import { Storage } from './index';
import { tryParseJson } from '@/utils/json-parser';
import { isDefined } from '@/utils/type-helper';

const APP_KEY = 'links:';

export default class RedisStorage implements Storage {
  client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });

    this.client.on('error', (err) => console.log('Redis Client Error', err));
  }

  async getAll(key?: string[]) {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
    const keys = key ?? (await this.client.keys(APP_KEY + '*'));
    if (keys.length === 0) {
      await this.client.disconnect();
      return [];
    }
    const list = await this.client.mGet(keys);
    await this.client.disconnect();
    return list
      .map((data) => {
        const parsed = tryParseJson<LinkData>(data);
        if (parsed) {
          return parsed;
        }
      })
      .filter(isDefined);
  }

  async get(key: string) {
    await this.client.connect();
    const result = await this.client.get(APP_KEY + key);
    await this.client.disconnect();
    if (typeof result === 'string') {
      try {
        return JSON.parse(result) as LinkData;
      } catch (e) {}
    }
  }

  async set(key: string, data: LinkData) {
    const px = data.expireDate - data.registerDate;
    await this.client.connect();
    await this.client.set(APP_KEY + key, JSON.stringify(data), { PX: px });
    await this.client.disconnect();
  }

  async delete(key: string | string[]) {
    await this.client.connect();
    const target = key instanceof Array ? key : [key];
    await Promise.all(target.map((x) => this.client.del(APP_KEY + x)));
    await this.client.disconnect();
  }
}
