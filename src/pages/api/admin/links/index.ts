import { NextApiRequest, NextApiResponse } from 'next';
import storage from '@/shared/libs/storage';
import { CoreLinkData, LinkFormData } from '@/types';
import { KEY_LENGTH } from '@/shared/constants/key';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import InvalidInputError from '@/shared/libs/errors/InvalidInputError';
import AuthError from '@/shared/libs/errors/AuthError';
import PermissionError from '@/shared/libs/errors/PermissionError';
import { addLink } from '@/services/link';
import { createHash } from 'crypto';
import DuplicatedError from '@/shared/libs/errors/DuplicatedError';

// const genKey = customAlphabet(KEY_BASE);

function genHashKey(link: LinkFormData) {
  const data: CoreLinkData = {
    webUrl: link.webUrl,
    aosUrl: link.aosUrl,
    iosUrl: link.iosUrl,
    bridgeType: link.bridgeType,
    bridgeTemplate: link.bridgeTemplate,
    appCall: link.appCall,
  };
  const str = Object.values(data)
    .map((x) => (x ? x : ''))
    .join(';');
  return createHash('sha512')
    .update(str)
    .digest('base64url')
    .slice(0, KEY_LENGTH);
}

export default async function links(req: NextApiRequest, res: NextApiResponse) {
  try {
    const method = req.method || '';
    if (/get/i.test(method)) {
      res.json(await storage.getAll());
      return;
    } else if (/post/i.test(method)) {
      const body: LinkFormData = req.body;
      const key = genHashKey(body);

      const exists = await storage.get(key);
      if (exists) {
        throw new DuplicatedError(key);
      }

      await addLink(
        genHashKey(body),
        body,
        await getServerSession(req, res, authOptions),
      );
      res.json({ key });
      return;
    }
  } catch (e) {
    if (e instanceof InvalidInputError) {
      res.status(400).send(e.message || 'Invalid input');
    } else if (e instanceof AuthError) {
      res.status(401).send(e.message || 'Unauthorized');
    } else if (e instanceof PermissionError) {
      res.status(403).send(e.message || 'Forbidden');
    } else if (e instanceof DuplicatedError) {
      res.status(409).send(e.message || 'Conflict');
    } else {
      throw e;
    }
  }

  res.status(404).send('Not Found');
}
