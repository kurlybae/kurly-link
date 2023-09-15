import { ParsedUrlQuery } from 'querystring';

const appOpenUriScheme = process.env.NEXT_PUBLIC_APP_OPEN_URI_SCHEME;

export function getAppOpenLink(url?: string) {
  if (!url) {
    return undefined;
  }
  return appOpenUriScheme + encodeURIComponent(url);
}

export function appendQueryString<T extends string | null>(
  base: T,
  query: string | ParsedUrlQuery,
) {
  if (!base) {
    return base;
  }
  const queryString = (
    typeof query === 'string'
      ? query
      : Object.entries(query)
          .map(
            ([key, value]) =>
              `${key}=${encodeURIComponent(value?.toString() || '')}`,
          )
          .join('&')
  ).replace(/^\?/, '');
  if (!queryString) {
    return base;
  }
  if (base.includes('?')) {
    return base + '&' + queryString;
  } else {
    return base + '?' + queryString;
  }
}
