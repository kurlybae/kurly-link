// 62개 문자 중 10개 순열
// P(62,10) = 390164706723052800
// export const KEY_BASE =
//   'abcdefghizklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const KEY_LENGTH = 8;

export const KEY_REGEX_SOURCE = new RegExp(`[a-zA-Z0-9-_]{${KEY_LENGTH}}`)
  .source;

const onlyKeyRegex = new RegExp(`^${KEY_REGEX_SOURCE}$`);

export const isKey = (input: unknown): input is string =>
  typeof input === 'string' && onlyKeyRegex.test(input);
