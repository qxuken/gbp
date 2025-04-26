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

export function mutateFieldImmer<V, K extends keyof V>(
  mutate: (cb: (v: V) => void) => void,
  fieldName: K,
) {
  return function (v: V[K]) {
    mutate((value) => (value[fieldName] = v));
  };
}
