export function weakMapGetOrSetDefault<K extends WeakKey, V>(
  map: WeakMap<K, V>,
  key: K,
  defaultFactory: () => V,
): V {
  if (!map.has(key)) {
    map.set(key, defaultFactory());
  }
  return map.get(key)!;
}

export function mapGetOrSetDefault<K, V>(
  map: Map<K, V>,
  key: K,
  defaultFactory: () => V,
): V {
  if (!map.has(key)) {
    map.set(key, defaultFactory());
  }
  return map.get(key)!;
}
