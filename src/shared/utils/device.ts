import { NEXT_PUBLIC_APP_UA_REGEX } from '@/shared/configs';

const appRegex = NEXT_PUBLIC_APP_UA_REGEX
  ? new RegExp(NEXT_PUBLIC_APP_UA_REGEX)
  : undefined;

export function isAppWebview(useragent?: string): boolean {
  if (!appRegex) {
    return false;
  }
  const ua =
    useragent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  return appRegex.test(ua);
}
