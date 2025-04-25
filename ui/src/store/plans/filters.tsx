import fuzzysearch from 'fuzzysearch';
import { Immer, produce, WritableDraft } from 'immer';
import {
  createContext,
  useMemo,
  use,
  useCallback,
  PropsWithChildren,
} from 'react';

import { useCharactersMap } from '@/api/dictionaries/hooks';
import { usePlans } from '@/api/plans/plans';
import { Characters, Plans } from '@/api/types';

export type TPlansFilter = {
  name: string;
  elements: Set<string>;
  weaponTypes: Set<string>;
  characters: Set<string>;
  /** Key: artifact type, Value: set of specials */
  artifactTypeSpecials: Map<string, Set<string>>;
};

interface FiltersContextType {
  value: TPlansFilter;
  setValue(v: TPlansFilter): void;
  isFiltersEnabled: boolean;
}

const FiltersContext = createContext<FiltersContextType | null>(null);

type Props = PropsWithChildren<{
  value: TPlansFilter;
  setValue(v: TPlansFilter): void;
}>;

export function FiltersProvider({ children, value, setValue }: Props) {
  const context = useMemo(
    () => ({
      value,
      setValue,
      isFiltersEnabled:
        value.name.length > 0 ||
        value.elements.size > 0 ||
        value.weaponTypes.size > 0 ||
        value.artifactTypeSpecials.size > 0 ||
        value.characters.size > 0,
    }),
    [value],
  );

  return (
    <FiltersContext.Provider value={context}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const context = use(FiltersContext);
  if (!context)
    throw new Error('useFilters should be used inside FiltersContext');
  return context.value;
}

export function useSetFilters() {
  const context = use(FiltersContext);
  if (!context)
    throw new Error('useFilters should be used inside FiltersContext');
  return useCallback(
    (cb: (v: WritableDraft<TPlansFilter>) => void) => {
      const newValue = produce(context.value, cb);
      context.setValue(newValue);
    },
    [context],
  );
}

export function useFiltersEnabled() {
  const context = use(FiltersContext);
  if (!context)
    throw new Error('useFiltersEnabled should be used inside FiltersContext');
  return context.isFiltersEnabled;
}

export function useAvailableFilters() {
  const plans = usePlans();
  const charactersMap = useCharactersMap();

  return useMemo(() => {
    const res = {
      elements: new Set<string>(),
      weaponTypes: new Set<string>(),
      characters: new Set<string>(),
    };
    for (const item of plans) {
      const character = charactersMap.get(item.character);
      if (!character) {
        continue;
      }
      if (character.element) {
        res.elements.add(character.element);
      }
      res.weaponTypes.add(character.weaponType);
      res.characters.add(character.id);
    }
    return res;
  }, [plans, charactersMap]);
}

export function useCharacterFilterFn() {
  const filters = useFilters();

  return useCallback(
    (character: Characters, plan?: Plans) => {
      const simpleFilters =
        (filters.elements.size == 0 ||
          (character.element && filters.elements.has(character.element))) &&
        (filters.weaponTypes.size == 0 ||
          filters.weaponTypes.has(character.weaponType));

      const artifactTypeSpecialsFilter = () => {
        if (filters.artifactTypeSpecials.size == 0) {
          return true;
        }
        if (!plan?.artifactTypePlans) {
          return false;
        }
        return plan.artifactTypePlans.some((atp) =>
          filters.artifactTypeSpecials.get(atp.artifactType)?.has(atp.special),
        );
      };

      const nameFilter = () =>
        !filters.name ||
        fuzzysearch(filters.name.toLowerCase(), character.name.toLowerCase());

      return simpleFilters && artifactTypeSpecialsFilter() && nameFilter();
    },
    [filters],
  );
}
