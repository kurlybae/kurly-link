export function uniq<T extends string | number>(input: T[]) {
  const set = new Set(input);
  return Array.from(set.values());
}
