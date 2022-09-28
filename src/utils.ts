export function chunk(ids: string[], size = 1) {
  const length = ids.length;
  if (!length || size < 1) return [];
  let index = 0;
  let resIndex = 0;
  const result = new Array(Math.ceil(length / size));
  while (index < length) {
    result[resIndex++] = ids.slice(index, (index += size));
  }
  return result;
}
