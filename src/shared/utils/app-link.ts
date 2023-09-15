import { NEXT_PUBLIC_APP_OPEN_URI_SCHEME } from '@/shared/configs';

export function getAppOpenLink(url?: string) {
  if (!url || !NEXT_PUBLIC_APP_OPEN_URI_SCHEME) {
    return undefined;
  }
  return NEXT_PUBLIC_APP_OPEN_URI_SCHEME + encodeURIComponent(url);
}
