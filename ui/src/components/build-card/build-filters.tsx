import { SelectTrigger } from '@radix-ui/react-select';
import { useState } from 'react';

import {
  useArtifactTypes,
  useElements,
  useSpecialsMap,
} from '@/api/dictionaries/atoms';
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
import { cn } from '@/lib/utils';
import { useArtifactTypesPlansSpecialsMap } from '@/store/plans/artifactTypePlans';
import {
  useAvailableFilters,
  useFilters,
  useFiltersEnabled,
} from '@/store/plans/filters';
import { useWeaponPlans } from '@/store/plans/weaponsPlans';

export default function BuildFilters() {
  const [isOpen, setIsOpen] = useState(true);
  const elements = useElements();
  const weaponTypes = useWeaponPlans();
  const artifactTypes = useArtifactTypes();

  const [filters, setFilters] = useFilters();
  const availableFilters = useAvailableFilters();
  const filtersEnabled = useFiltersEnabled();

  const specialsMap = useSpecialsMap();

  const activeArtifactTypesPlans = useArtifactTypesPlansSpecialsMap();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <section
        aria-label="Filters"
        className="p-3 grid gap-2 min-w-xs border border-border border-dashed rounded-xl"
      >
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
        <CollapsibleContent className="grid gap-2">
          <Input
            id="name"
            type="text"
            placeholder="Search"
            value={filters.name}
            onChange={(e) =>
              setFilters((filters) => {
                filters.name = e.target.value;
              })
            }
          />
          <div className="flex flex-wrap gap-y-1 gap-x-2">
            {elements?.map((element) => (
              <Button
                key={element.id}
                variant={
                  filters.elements.has(element.id) ? 'secondary' : 'outline'
                }
                size="sm"
                disabled={!availableFilters.elements.has(element.id)}
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
          <div className="flex flex-wrap gap-y-1 gap-x-2">
            {weaponTypes?.map((weaponType) => (
              <Button
                key={weaponType.id}
                variant={
                  filters.weaponTypes.has(weaponType.id)
                    ? 'secondary'
                    : 'outline'
                }
                size="sm"
                disabled={!availableFilters.weaponTypes.has(weaponType.id)}
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

          <div className="grid gap-2 w-full">
            {artifactTypes?.map((at) => {
              const selectedSpecials = filters.artifactTypeSpecials.get(at.id);
              const selectedArr = Array.from(selectedSpecials?.values() ?? []);
              const activeSpecials = activeArtifactTypesPlans?.get(at.id);
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
                  <div className="flex flex-wrap gap-1 items-start">
                    {selectedArr.map((s, i) => {
                      const special = specialsMap?.get(s);
                      if (!special) {
                        return null;
                      }
                      return (
                        <div
                          key={special.id}
                          className="flex gap-1 items-center"
                        >
                          <button
                            className="text-md after:text-gray-400 cursor-pointer hover:line-through focus:line-through"
                            onClick={() => {
                              setFilters((filters) => {
                                const artifactTypeSpecials =
                                  filters.artifactTypeSpecials;
                                const selected = artifactTypeSpecials.get(
                                  at.id,
                                );
                                if (!selected) return;
                                selected.delete(s);
                                if (selected.size === 0) {
                                  artifactTypeSpecials.delete(at.id);
                                }
                              });
                            }}
                          >
                            {special.name}
                          </button>
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
                            const artifactTypeSpecials =
                              filters.artifactTypeSpecials;
                            const selected = artifactTypeSpecials.get(at.id);
                            selected?.add(s);
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
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
