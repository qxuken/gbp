import { SelectTrigger } from '@radix-ui/react-select';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

import { db } from '@/api/dictionaries/db';
import { ArtifactTypePlans, Specials } from '@/api/types';
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

export type TBuildFilter = {
  name: string;
  elements: Set<string>;
  weaponTypes: Set<string>;
  characters: Set<string>;
  /** Key: artifact type, Value: set of specials */
  artifactTypeSpecials: Map<string, Set<string>>;
};

type Props = TBuildFilter & {
  artifactTypePlansData?: ArtifactTypePlans[];
  availableElements: Set<string>;
  availableWeaponTypes: Set<string>;
  availableCharacters: Set<string>;
  onChange(v: Partial<TBuildFilter>): void;
  hasActiveFilters: boolean;
};

export function BuildFilters(props: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const elements = useLiveQuery(() => db.elements.toArray(), []);
  const weaponTypes = useLiveQuery(() => db.weaponTypes.toArray(), []);
  const artifactTypes = useLiveQuery(
    () => db.artifactTypes.orderBy('order').toArray(),
    [],
  );
  const specialsMap = useLiveQuery(
    () =>
      db.specials.toArray().then((s) =>
        s.reduce((acc, it) => {
          acc.set(it.id, it);
          return acc;
        }, new Map<string, Specials>()),
      ),
    [],
  );
  const activeArtifactTypesPlans = props.artifactTypePlansData?.reduce(
    (acc, it) => {
      let types = acc.get(it.artifactType);
      if (!types) {
        types = new Set();
        acc.set(it.artifactType, types);
      }
      types.add(it.special);
      return acc;
    },
    new Map<string, Set<string>>(),
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <section
        aria-label="Filters"
        className="p-3 grid gap-2 min-w-xs border border-border border-dashed rounded-xl"
      >
        <div className="flex justify-between gap-2">
          <h3 className="text-md font-semibold">Filter</h3>
          <div className="flex gap-2">
            {props.hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  props.onChange({
                    name: '',
                    elements: new Set(),
                    weaponTypes: new Set(),
                    characters: new Set(),
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
            value={props.name}
            onChange={(e) => props.onChange({ name: e.target.value })}
          />
          <div className="flex flex-wrap gap-y-1 gap-x-2">
            {elements?.map((element) => (
              <Button
                key={element.id}
                variant={
                  props.elements.has(element.id) ? 'secondary' : 'outline'
                }
                size="sm"
                disabled={!props.availableElements.has(element.id)}
                onClick={() => {
                  const elements = new Set(props.elements);
                  if (elements.has(element.id)) {
                    elements.delete(element.id);
                  } else {
                    elements.add(element.id);
                  }
                  props.onChange({ elements });
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
                  props.weaponTypes.has(weaponType.id) ? 'secondary' : 'outline'
                }
                size="sm"
                disabled={!props.availableWeaponTypes.has(weaponType.id)}
                onClick={() => {
                  const weaponTypes = new Set(props.weaponTypes);
                  if (weaponTypes.has(weaponType.id)) {
                    weaponTypes.delete(weaponType.id);
                  } else {
                    weaponTypes.add(weaponType.id);
                  }
                  props.onChange({ weaponTypes });
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
              const selectedSpecials = props.artifactTypeSpecials.get(at.id);
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
                              const artifactTypeSpecials = new Map(
                                props.artifactTypeSpecials,
                              );
                              const selected = new Set(
                                artifactTypeSpecials.get(at.id),
                              );
                              selected.delete(s);
                              if (selected.size === 0) {
                                artifactTypeSpecials.delete(at.id);
                              } else {
                                artifactTypeSpecials.set(at.id, selected);
                              }
                              props.onChange({ artifactTypeSpecials });
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
                          const artifactTypeSpecials = new Map(
                            props.artifactTypeSpecials,
                          );
                          const selected = new Set(
                            artifactTypeSpecials.get(at.id),
                          );
                          selected.add(s);
                          artifactTypeSpecials.set(at.id, selected);

                          props.onChange({ artifactTypeSpecials });
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
