import { NextApiRequest, NextApiResponse } from 'next';
import storage from '@/shared/libs/storage';
import { CoreLinkData } from '@/types';
import { setLink } from '@/shared/utils/url-helper';

export default async function link(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method || '';
  const { key, ...restQuery } = req.query;
  if (/get/i.test(method) && key) {
    const result = await storage.get(key.toString());
    if (result) {
      const response: CoreLinkData = {
        webUrl: setLink(result.webUrl, restQuery),
        iosUrl: setLink(result.iosUrl, restQuery),
        aosUrl: setLink(result.aosUrl, restQuery),
        bridgeType: result.bridgeType,
        bridgeTemplate: result.bridgeTemplate,
        appCall: result.appCall,
      };
      res.json(response);
      return;
    }
  }

  res.status(404).send('Not Found');
}
