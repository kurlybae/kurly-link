import { NextApiRequest, NextApiResponse } from 'next';
import storage from '@/libs/storage';
import { LinkFormData } from '@/types';
import { KEY_LENGTH } from '@/constants/key';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import InvalidInputError from '@/libs/errors/InvalidInputError';
import AuthError from '@/libs/errors/AuthError';
import PermissionError from '@/libs/errors/PermissionError';
import { addLink } from '@/services/link';
import { createHash } from 'crypto';
import DuplicatedError from '@/libs/errors/DuplicatedError';

// const genKey = customAlphabet(KEY_BASE);

function genHashKey(link: LinkFormData) {
  const data =
    link.webUrl + (link.aosUrl ?? '-') + (link.iosUrl ?? '-') + link.appOnly;
  return createHash('sha512')
    .update(data)
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
