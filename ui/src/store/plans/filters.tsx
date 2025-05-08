import fuzzysearch from 'fuzzysearch';
import { produce, WritableDraft } from 'immer';
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
import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';

/** Key: artifact type, Value: set of specials */
type FilterSpecialsByArtifactTypePlans = Map<string, Set<string>>;

export type PlansFilters = {
  name: string;
  elements: Set<string>;
  weaponTypes: Set<string>;
  characters: Set<string>;
  artifactSets: Set<string>;
  specialsByArtifactTypePlans: FilterSpecialsByArtifactTypePlans;
};

export type PlansAvailableFilters = {
  elements: Set<string>;
  weaponTypes: Set<string>;
  characters: Set<string>;
  artifactSets: Set<string>;
  specialsByArtifactTypePlans: FilterSpecialsByArtifactTypePlans;
};

interface FiltersContextType {
  value: PlansFilters;
  availableFilters: PlansAvailableFilters;
  isFiltersEnabled: boolean;
  setValue(cb: (v: WritableDraft<PlansFilters>) => void): void;
}

const FiltersContext = createContext<FiltersContextType | null>(null);

type Props = PropsWithChildren<{
  value: PlansFilters;
  setValue(v: PlansFilters): void;
}>;

export function FiltersProvider({ children, value, setValue }: Props) {
  const plans = usePlans();
  const charactersMap = useCharactersMap();
  const availableFilters = useMemo(() => {
    const res: PlansAvailableFilters = {
      elements: new Set(),
      weaponTypes: new Set(),
      characters: new Set(),
      artifactSets: new Set(),
      specialsByArtifactTypePlans: new Map(),
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
      for (const asp of item.artifactSetsPlans ?? []) {
        for (const as of asp.artifactSets) {
          res.artifactSets.add(as);
        }
      }
      for (const atp of item.artifactTypePlans ?? []) {
        mapGetOrSetDefault(
          res.specialsByArtifactTypePlans,
          atp.artifactType,
          () => new Set<string>(),
        ).add(atp.special);
      }
    }
    return res;
  }, [plans, charactersMap]);

  const context: FiltersContextType = useMemo(
    () => ({
      value,
      availableFilters,
      isFiltersEnabled:
        value.name.length > 0 ||
        value.elements.size > 0 ||
        value.weaponTypes.size > 0 ||
        value.artifactSets.size > 0 ||
        value.specialsByArtifactTypePlans.size > 0 ||
        value.characters.size > 0,
      setValue(cb: (v: WritableDraft<PlansFilters>) => void) {
        setValue(produce(context.value, (d) => void cb(d)));
      },
    }),
    [value, availableFilters, setValue],
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

export function useFiltersSelector<Key extends keyof PlansFilters>(
  key: Key,
): PlansFilters[Key] {
  const context = use(FiltersContext);
  if (!context)
    throw new Error('useFiltersSelector should be used inside FiltersContext');
  return context.value[key];
}

export function useFiltersEnabled() {
  const context = use(FiltersContext);
  if (!context)
    throw new Error('useFiltersEnabled should be used inside FiltersContext');
  return context.isFiltersEnabled;
}

export function useAvailableFilters() {
  const context = use(FiltersContext);
  if (!context)
    throw new Error('useAvailableFilters should be used inside FiltersContext');
  return context.availableFilters;
}

export function useAvailableFiltersSelector<
  Key extends keyof PlansAvailableFilters,
>(key: Key): PlansAvailableFilters[Key] {
  const context = use(FiltersContext);
  if (!context)
    throw new Error('useAvailableFilters should be used inside FiltersContext');
  return context.availableFilters[key];
}

export function useSetFilters() {
  const context = use(FiltersContext);
  if (!context)
    throw new Error('useSetFilters should be used inside FiltersContext');
  return context.setValue;
}

export function useCharacterFilterFn() {
  const filters = useFilters();
  const filtersEnabled = useFiltersEnabled();
  return useCallback(
    (character: Characters, plan?: Plans) => {
      if (!filtersEnabled) return true;

      const simpleFilters =
        (filters.elements.size == 0 ||
          (character.element && filters.elements.has(character.element))) &&
        (filters.weaponTypes.size == 0 ||
          filters.weaponTypes.has(character.weaponType));

      const artifactTypeSpecialsFilter = () => {
        if (filters.specialsByArtifactTypePlans.size == 0) {
          return true;
        }
        if (!plan?.artifactTypePlans) {
          return false;
        }
        return plan.artifactTypePlans.some((atp) =>
          filters.specialsByArtifactTypePlans
            .get(atp.artifactType)
            ?.has(atp.special),
        );
      };

      const artifactSetsSpecialsFilter = () => {
        if (filters.artifactSets.size == 0) {
          return true;
        }
        if (!plan?.artifactSetsPlans) {
          return false;
        }
        return plan.artifactSetsPlans.some((atp) =>
          atp.artifactSets.some((as) => filters.artifactSets.has(as)),
        );
      };

      const nameFilter = () =>
        !filters.name ||
        fuzzysearch(filters.name.toLowerCase(), character.name.toLowerCase());

      return (
        simpleFilters &&
        artifactTypeSpecialsFilter() &&
        artifactSetsSpecialsFilter() &&
        nameFilter()
      );
    },
    [filters],
  );
}
