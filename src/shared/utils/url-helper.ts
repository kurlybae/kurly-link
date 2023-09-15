import { ParsedUrlQuery } from 'querystring';
import InvalidInputError from '@/shared/libs/errors/InvalidInputError';
import { uniq } from '@/shared/utils/index';
import { NEXT_PUBLIC_APP_OPEN_URI_SCHEME, ORIGIN } from '@/shared/configs';

export function getAppOpenLink(url?: string) {
  if (!url || !NEXT_PUBLIC_APP_OPEN_URI_SCHEME) {
    return undefined;
  }
  return NEXT_PUBLIC_APP_OPEN_URI_SCHEME + encodeURIComponent(url);
}

export function getParamsFromUrl(url: string) {
  const params = uniq(
    Array.from(url.matchAll(/\$(\w+)\b/g)).map((x) => x[1]),
  ).filter((x) => !!x);

  const numberParams = params
    .filter((param) => /^\d+$/.test(param))
    .map(Number)
    .sort((a, b) => a - b);
  const stringParams = params.filter((param) => !/^\d+$/.test(param));
  return { params, numberParams, stringParams };
}

function replaceParams(
  base: string,
  { __orgPath, ...restQuery }: ParsedUrlQuery,
): { replaced: string; restQuery: ParsedUrlQuery } {
  const { params } = getParamsFromUrl(base);
  if (params.length > 0) {
    const pathParams =
      typeof __orgPath === 'string' ? __orgPath.split('/') : [];
    const result = params.reduce((res, key) => {
      const typedKey = /^\d+$/.test(key) ? Number(key) : key;
      if (typeof typedKey === 'number') {
        const param = pathParams[typedKey - 1];
        if (!param) {
          throw new InvalidInputError();
        }
        return res.replace(new RegExp(`(\\$${typedKey})(?=\\b)`, 'g'), param);
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

export function getUrl(key: string, webUrl: string, withoutOrigin?: boolean) {
  const { numberParams, stringParams } = getParamsFromUrl(webUrl);

  const additionalPath = Array.from(
    { length: Math.max(...numberParams) },
    (x, idx) => {
      return `$${idx + 1}`;
    },
  ).join('/');

  const origin = withoutOrigin ? '' : ORIGIN || location.origin;

  return `${origin}/${key}${additionalPath ? `/${additionalPath}` : ''}${
    stringParams.length > 0
      ? `?${stringParams.map((param) => `${param}=$${param}`).join('&')}`
      : ''
  }`;
}
