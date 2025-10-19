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
  complete: boolean;
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
  filter(character: Characters, plan?: Plans): boolean;
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
  const isFiltersEnabled = useMemo(
    () =>
      value.name.length > 0 ||
      value.elements.size > 0 ||
      value.weaponTypes.size > 0 ||
      value.artifactSets.size > 0 ||
      value.specialsByArtifactTypePlans.size > 0 ||
      value.characters.size > 0,
    [value],
  );

  const filter = useCallback(
    (character: Characters, plan?: Plans): boolean => {
      if (!value.complete && plan?.complete) return false;
      if (!isFiltersEnabled) return true;

      const simpleFilters: boolean =
        (value.elements.size == 0 ||
          (!!character.element && value.elements.has(character.element))) &&
        (value.weaponTypes.size == 0 ||
          value.weaponTypes.has(character.weaponType));

      const artifactTypeSpecialsFilter = () => {
        if (value.specialsByArtifactTypePlans.size == 0) {
          return true;
        }
        if (!plan?.artifactTypePlans) {
          return false;
        }
        return Array.from(value.specialsByArtifactTypePlans.entries()).every(
          ([at, specials]) =>
            plan.artifactTypePlans?.some(
              (atp) => atp.artifactType == at && specials.has(atp.special),
            ),
        );
      };

      const artifactSetsSpecialsFilter = () => {
        if (value.artifactSets.size == 0) {
          return true;
        }
        if (!plan?.artifactSetsPlans) {
          return false;
        }
        return plan.artifactSetsPlans.some((atp) =>
          atp.artifactSets.some((as) => value.artifactSets.has(as)),
        );
      };

      const nameFilter = () =>
        !value.name ||
        fuzzysearch(value.name.toLowerCase(), character.name.toLowerCase());

      return (
        simpleFilters &&
        artifactTypeSpecialsFilter() &&
        artifactSetsSpecialsFilter() &&
        nameFilter()
      );
    },
    [value],
  );

  const availableFilters = useMemo(() => {
    const res: PlansAvailableFilters = {
      elements: new Set(value.elements),
      weaponTypes: new Set(value.weaponTypes),
      characters: new Set(value.characters),
      artifactSets: new Set(value.artifactSets),
      specialsByArtifactTypePlans: new Map(
        Array.from(
          value.specialsByArtifactTypePlans.entries(),
          ([key, value]) => [key, new Set(value)] as const,
        ),
      ),
    };
    for (const plan of plans) {
      const character = charactersMap.get(plan.character);
      if (!character) {
        continue;
      }
      if (character.element) {
        res.elements.add(character.element);
      }
      res.weaponTypes.add(character.weaponType);
      res.characters.add(character.id);
      for (const asp of plan.artifactSetsPlans ?? []) {
        for (const as of asp.artifactSets) {
          res.artifactSets.add(as);
        }
      }
      if (filter(character, plan)) {
        for (const atp of plan.artifactTypePlans ?? []) {
          mapGetOrSetDefault(
            res.specialsByArtifactTypePlans,
            atp.artifactType,
            () => new Set<string>(),
          ).add(atp.special);
        }
      }
    }
    return res;
  }, [value, plans, charactersMap]);

  const context: FiltersContextType = useMemo(
    () => ({
      value,
      availableFilters,
      isFiltersEnabled,
      filter,
      setValue(cb: (v: WritableDraft<PlansFilters>) => void) {
        setValue(produce(context.value, (d) => void cb(d)));
      },
    }),
    [value, isFiltersEnabled, availableFilters, setValue],
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
  const context = use(FiltersContext);
  if (!context)
    throw new Error(
      'useCharacterFilterFn should be used inside FiltersContext',
    );
  return context.filter;
}
