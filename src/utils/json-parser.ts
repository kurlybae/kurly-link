export function tryParseJson<T>(input: unknown): T | undefined {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as T;
    } catch (e) {}
  }
}
