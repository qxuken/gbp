export function mutateField<V>(
  mutate: (v: V) => void,
  currentValue: V | undefined,
  fieldName: keyof V,
) {
  return function (v: V[keyof V]) {
    if (currentValue === undefined) {
      return undefined;
    }
    mutate({ ...currentValue, [fieldName]: v });
  };
}
