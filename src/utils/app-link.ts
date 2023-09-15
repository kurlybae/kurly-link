const appOpenUriScheme = process.env.NEXT_PUBLIC_APP_OPEN_URI_SCHEME;

export function getAppOpenLink(url?: string) {
  if (!url) {
    return undefined;
  }
  return appOpenUriScheme + encodeURIComponent(url);
}
