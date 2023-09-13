import { NextApiRequest, NextApiResponse } from 'next';
import storage from '@/libs/storage';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const method = req.method || '';
  if (/get/i.test(method) && req.query.key) {
    res.json(await storage.get(req.query.key.toString()));
    return;
  }

  res.status(404).send('Not Found');
};
