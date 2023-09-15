import { ParsedUrlQuery } from 'querystring';
import InvalidInputError from '@/shared/libs/errors/InvalidInputError';
import { uniq } from '@/shared/utils/index';

function replaceParams(
  base: string,
  { __orgPath, ...restQuery }: ParsedUrlQuery,
): { replaced: string; restQuery: ParsedUrlQuery } {
  const matches = uniq(
    Array.from(base.matchAll(/\$(\w+)/g)).map((x) => x[1]),
  ).filter((x) => !!x);
  if (matches.length > 0) {
    const pathParams =
      typeof __orgPath === 'string' ? __orgPath.split('/') : [];
    const result = matches.reduce((res, key) => {
      const typedKey = /^\d+$/.test(key) ? Number(key) : key;
      if (typeof typedKey === 'number') {
        const param = pathParams[typedKey - 1];
        if (!param) {
          throw new InvalidInputError();
        }
        return res.replace(new RegExp(`(\\$${typedKey})(?=\\D|$)`, 'g'), param);
      } else {
        const param = restQuery[typedKey];
        if (typeof param !== 'string') {
          throw new InvalidInputError();
        }
        delete restQuery[typedKey];
        return res.replace(new RegExp(`(\\$${typedKey})(?=\\b)`, 'g'), param);
      }
    }, base);

    return { replaced: result, restQuery };
  }
  return { replaced: base, restQuery };
}

export function setLink<T extends string | null>(
  base: T,
  query: ParsedUrlQuery,
) {
  if (!base) {
    return base;
  }

  const { replaced, restQuery } = replaceParams(base, query);

  const queryString = Object.entries(restQuery)
    .map(
      ([key, value]) => `${key}=${encodeURIComponent(value?.toString() || '')}`,
    )
    .join('&')
    .replace(/^\?/, '');
  if (!queryString) {
    return replaced;
  }

  return replaced + (replaced.includes('?') ? '&' : '?') + queryString;
}
