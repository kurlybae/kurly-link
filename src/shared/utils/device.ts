import {
  NEXT_PUBLIC_APP_UA_REGEX,
  IOS_URI_SCHEME_SAFE_USER_AGENT_REGEX,
} from '@/shared/configs';
import UAParser from 'ua-parser-js';

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

export function isUriSchemeSafeBrowser(ua: UAParser.IResult): boolean {
  if (ua.device.type === 'mobile') {
    if (ua.os.name === 'Android') {
      return true;
    } else {
      return IOS_URI_SCHEME_SAFE_USER_AGENT_REGEX.test(ua.ua);
    }
  }

  return false;
}

