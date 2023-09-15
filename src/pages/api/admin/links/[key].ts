import { NextApiRequest, NextApiResponse } from 'next';
import storage from '@/libs/storage';
import { LinkFormData } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { addLink } from '@/services/link';
import InvalidInputError from '@/libs/errors/InvalidInputError';
import AuthError from '@/libs/errors/AuthError';
import PermissionError from '@/libs/errors/PermissionError';
import { isKey } from '@/constants/key';
import DuplicatedError from '@/libs/errors/DuplicatedError';

export default async function link(req: NextApiRequest, res: NextApiResponse) {
  try {
    const method = req.method || '';
    if (/get/i.test(method) && req.query.key) {
      const result = await storage.get(req.query.key.toString());
      if (result) {
        res.json(result);
        return;
      }
    } else if (/delete/i.test(method) && req.query.key) {
      const targets = req.query.key.toString().split(',');

      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        throw new AuthError();
      }
      if (!session.user.role.includes('admin')) {
        const list = await storage.getAll(targets);
        if (!list.every((x) => x.registerEmail !== session.user.email)) {
          throw new PermissionError();
        }
      }

      res.json(await storage.delete(targets));
      res.json({ deleted: targets });
      return;
    } else if (/patch/i.test(method) && req.query.key) {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        throw new AuthError();
      }
      const key = req.query.key.toString();
      if (!isKey(key)) {
        throw new InvalidInputError('key 형식이 잘못되었습니다.');
      }
      if (!session.user.role.includes('admin')) {
        const data = await storage.get(key);
        if (data && data.registerEmail !== session.user.email) {
          throw new PermissionError();
        }
      }

      const body: LinkFormData = req.body;
      await addLink(key, body, await getServerSession(req, res, authOptions));
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
