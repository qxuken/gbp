export function mutateField<V>(
  mutate: (v: V) => void,
  currentValue: V,
  fieldName: keyof V,
) {
  return function (v: V[keyof V]) {
    mutate({ ...currentValue, [fieldName]: v });
  };
}
