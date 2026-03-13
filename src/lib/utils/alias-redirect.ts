export type AliasSearchParams = Record<string, string | string[] | undefined>;

export function buildAliasRedirectPath(destination: string, rawParams?: AliasSearchParams) {
  if (!rawParams) {
    return destination;
  }

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(rawParams)) {
    if (!value) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          query.append(key, item);
        }
      }
      continue;
    }

    query.set(key, value);
  }

  const serialized = query.toString();
  return serialized ? `${destination}?${serialized}` : destination;
}
