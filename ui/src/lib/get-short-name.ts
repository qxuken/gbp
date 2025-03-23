export function getShortName(name?: string) {
  return (
    name
      ?.split(' ')
      .map((p) => p[0]?.toUpperCase())
      .join('') ?? '??'
  );
}
