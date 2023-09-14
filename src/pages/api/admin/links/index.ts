import { NextApiRequest, NextApiResponse } from 'next';
import { customAlphabet } from 'nanoid';
import storage from '@/libs/storage';
import { LinkData } from '@/types';
import { KEY_BASE, KEY_LENGTH } from '@/constants/key';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

// 62개 문자 중 10개 순열
// P(62,10) = 390164706723052800
const genKey = customAlphabet(KEY_BASE);

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method || '';
  if (/get/i.test(method)) {
    res.json(await storage.getAll());
    return;
  } else if (/post/i.test(method)) {
    const body: LinkData = req.body;
    if (body.webUrl) {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.email || !session?.user?.name) {
        throw new Error('정상적인 사용자가 아님');
      }
      body.requestEmail = session.user.email;
      body.requestName = session.user.name;
      const key = genKey(KEY_LENGTH);
      await storage.set(key, body);
      res.json({ key });
      return;
    }
    res.status(400).send('Invalid input');
    return;
  }

  res.status(404).send('Not Found');
}
