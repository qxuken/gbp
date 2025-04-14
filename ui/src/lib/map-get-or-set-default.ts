export function mapGetOrSetDefault<K, V>(
  map: Map<K, V>,
  key: K,
  defaultFactory: () => V,
): V;
export function mapGetOrSetDefault<K extends WeakKey, V>(
  map: WeakMap<K, V>,
  key: K,
  defaultFactory: () => V,
): V;

export function mapGetOrSetDefault<K, V>(
  map: unknown,
  key: K,
  defaultFactory: () => V,
): V {
  if (!(map as Map<K, V>).has(key)) {
    (map as Map<K, V>).set(key, defaultFactory());
  }
  return (map as Map<K, V>).get(key)!;
}
