import { Session } from 'next-auth';
import { LinkData, LinkFormData } from '@/types';
import storage from '@/libs/storage';
import InvalidInputError from '@/libs/errors/InvalidInputError';
import AuthError from '@/libs/errors/AuthError';

function validateForm(form: LinkFormData) {
  if (!form.webUrl) {
    throw new InvalidInputError();
  }
}

export async function addLink(
  key: string,
  form: LinkFormData,
  session: Session | null,
) {
  validateForm(form);
  if (!session?.user.email || !session?.user.name) {
    throw new AuthError('정상적인 사용자가 아님');
  }
  const data: LinkData = {
    ...form,
    key,
    registerEmail: session.user.email,
    registerName: session.user.name,
    // registerEmail: 'test@test.com',
    // registerName: '테스트유저',
    registerDate: Date.now(),
  };
  await storage.set(key, data);
}
