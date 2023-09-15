function getRequiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경변수 ${key}를 설정해주세요`);
  }
  return value;
}

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
export const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;

export const FALLBACK_URL = getRequiredEnv('FALLBACK_URL');

export const ADMIN_COMPANY_EMAIL = process.env.ADMIN_COMPANY_EMAIL;

export const ADMIN_USERS = process.env.ADMIN_USERS;

export const NEXT_PUBLIC_APP_URI_SCHEME =
  process.env.NEXT_PUBLIC_APP_URI_SCHEME;

export const NEXT_PUBLIC_APP_UA_REGEX = process.env.NEXT_PUBLIC_APP_UA_REGEX;

export const NEXT_PUBLIC_APP_OPEN_URI_SCHEME =
  process.env.NEXT_PUBLIC_APP_OPEN_URI_SCHEME;

export const ORIGIN = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : getRequiredEnv('ORIGIN');
