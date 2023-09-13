import { NextApiRequest, NextApiResponse } from 'next';
import { customAlphabet } from 'nanoid';
import storage from '@/libs/storage';
import { LinkData } from '@/types';
import { KEY_BASE, KEY_LENGTH } from '@/constants/key';

// 62개 문자 중 10개 순열
// P(62,10) = 390164706723052800
const genKey = customAlphabet(KEY_BASE);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const method = req.method || '';
  if (/get/i.test(method)) {
    res.json(await storage.getAll());
    return;
  } else if (/post/i.test(method)) {
    const body: LinkData = req.body;
    if (body.webUrl) {
      const key = genKey(KEY_LENGTH);
      await storage.set(key, body);
      res.json({ key });
      return;
    }
    res.status(400).send('Invalid input');
    return;
  }

  res.status(404).send('Not Found');
};
