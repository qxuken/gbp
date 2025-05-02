import { SelectTrigger } from '@radix-ui/react-select';

import {
  useArtifactTypes,
  useElements,
  useSpecialsMap,
  useWeaponTypes,
} from '@/api/dictionaries/hooks';
import { Specials } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';
import { cn } from '@/lib/utils';
import {
  useAvailableFiltersSelector,
  useFiltersEnabled,
  useFiltersSelector,
  useSetFilters,
} from '@/store/plans/filters';

export default function PlanFilters() {
  return (
    <Collapsible defaultOpen asChild>
      <section
        aria-label="Filters"
        className="p-3 grid gap-2 min-w-xs border border-border border-dashed rounded-xl"
      >
        <FilterHeader />
        <CollapsibleContent className="grid gap-2">
          <FilterName />
          <FilterElements />
          <FilterWeaponTypes />
          <FilterArtifactTypes />
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function FilterHeader() {
  const filtersEnabled = useFiltersEnabled();
  const setFilters = useSetFilters();
  return (
    <div className="flex justify-between gap-2">
      <h3 className="text-md font-semibold">Filter</h3>
      <div className="flex gap-2">
        {filtersEnabled && (
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setFilters((filters) => {
                filters.name = '';
                filters.elements.clear();
                filters.weaponTypes.clear();
                filters.characters.clear();
                filters.specialsByArtifactTypePlans.clear();
              });
            }}
          >
            Clear All
          </Button>
        )}
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <Icons.Dropdown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
    </div>
  );
}

function FilterName() {
  const value = useFiltersSelector('name');
  const setFilters = useSetFilters();
  return (
    <Input
      id="name"
      type="text"
      placeholder="Search"
      value={value}
      onChange={(e) =>
        setFilters((filters) => {
          filters.name = e.target.value;
        })
      }
    />
  );
}

function FilterElements() {
  const elements = useElements();
  const filter = useFiltersSelector('elements');
  const available = useAvailableFiltersSelector('elements');
  const setFilters = useSetFilters();
  return (
    <div className="flex flex-wrap gap-y-1 gap-x-2">
      {elements.map((element) => (
        <Button
          key={element.id}
          variant={filter.has(element.id) ? 'secondary' : 'outline'}
          size="sm"
          disabled={!available.has(element.id)}
          onClick={() => {
            setFilters((filters) => {
              const elements = filters.elements;
              if (elements.has(element.id)) {
                elements.delete(element.id);
              } else {
                elements.add(element.id);
              }
            });
          }}
        >
          <CollectionAvatar
            record={element}
            fileName={element.icon}
            name={element.name}
            className="size-4"
          />
          {element.name}
        </Button>
      ))}
    </div>
  );
}

function FilterWeaponTypes() {
  const weaponTypes = useWeaponTypes();
  const value = useFiltersSelector('weaponTypes');
  const available = useAvailableFiltersSelector('weaponTypes');
  const setFilters = useSetFilters();
  return (
    <div className="flex flex-wrap gap-y-1 gap-x-2">
      {weaponTypes.map((weaponType) => (
        <Button
          key={weaponType.id}
          variant={value.has(weaponType.id) ? 'secondary' : 'outline'}
          size="sm"
          disabled={!available.has(weaponType.id)}
          onClick={() => {
            setFilters((filters) => {
              const weaponTypes = filters.weaponTypes;
              if (weaponTypes.has(weaponType.id)) {
                weaponTypes.delete(weaponType.id);
              } else {
                weaponTypes.add(weaponType.id);
              }
            });
          }}
        >
          <CollectionAvatar
            record={weaponType}
            fileName={weaponType.icon}
            name={weaponType.name}
            className="size-4 not-dark:bg-black"
          />
          {weaponType.name}
        </Button>
      ))}
    </div>
  );
}

function FilterArtifactTypes() {
  const artifactTypes = useArtifactTypes();
  const specialsMap = useSpecialsMap();
  const value = useFiltersSelector('specialsByArtifactTypePlans');
  const available = useAvailableFiltersSelector('specialsByArtifactTypePlans');
  const setFilters = useSetFilters();
  return (
    <div className="grid gap-2 w-full">
      {artifactTypes.map((at) => {
        const selectedSpecials = value.get(at.id);
        const selectedArr = Array.from(selectedSpecials?.values() ?? []);
        const activeSpecials = available?.get(at.id);
        const options = Array.from(activeSpecials?.values() ?? [])
          .map((s) => specialsMap?.get(s))
          .filter((s) => s && !selectedSpecials?.has(s.id)) as Specials[];

        if (!activeSpecials || activeSpecials.size == 0) {
          return null;
        }
        return (
          <div key={at.id} className="w-full flex gap-2">
            <CollectionAvatar
              record={at}
              fileName={at.icon}
              name={at.name}
              className={cn('size-8', {
                ['opacity-50']: selectedArr.length === 0,
              })}
            />
            <div className="flex flex-wrap gap-1 items-center">
              {selectedArr.map((s, i) => {
                const special = specialsMap?.get(s);
                if (!special) {
                  return null;
                }
                return (
                  <div key={special.id} className="flex gap-1 items-center">
                    <Button
                      variant="destructive"
                      className="text-md leading-none py-0 px-2 not-hover:bg-transparent not-focus:bg-transparent"
                      onClick={() => {
                        setFilters((filters) => {
                          const artifactTypeSpecials =
                            filters.specialsByArtifactTypePlans;
                          const selected = artifactTypeSpecials.get(at.id);
                          if (!selected) return;
                          selected.delete(s);
                          if (selected.size === 0) {
                            artifactTypeSpecials.delete(at.id);
                          }
                        });
                      }}
                    >
                      {special.name}
                    </Button>
                    {selectedArr.length - 1 !== i && (
                      <Icons.Divide className="text-gray-400 size-4" />
                    )}
                  </div>
                );
              })}
              {options.length > 0 && (
                <Select
                  onValueChange={(s) => {
                    setFilters((filters) => {
                      mapGetOrSetDefault(
                        filters.specialsByArtifactTypePlans,
                        at.id,
                        () => new Set<string>(),
                      ).add(s);
                    });
                  }}
                  value=""
                >
                  <SelectTrigger data-slot="select-trigger" asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 opacity-50 hover:opacity-100 focus:opacity-100"
                    >
                      <Icons.Add />
                    </Button>
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((special) => (
                      <SelectItem key={special.id} value={special.id}>
                        {special.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
