import { NextApiRequest, NextApiResponse } from 'next';
import storage from '@/shared/libs/storage';

export default async function link(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method || '';
  if (/get/i.test(method) && req.query.key) {
    const result = await storage.get(req.query.key.toString());
    if (result) {
      res.json({
        webUrl: result.webUrl,
        iosUrl: result.iosUrl,
        aosUrl: result.aosUrl,
      });
      return;
    }
  }

  res.status(404).send('Not Found');
}
