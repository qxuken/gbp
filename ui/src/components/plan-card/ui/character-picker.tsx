import fuzzysearch from 'fuzzysearch';
import { PropsWithChildren, useMemo, useState } from 'react';

import {
  useCharacters,
  useElements,
  useWeaponTypes,
} from '@/api/dictionaries/hooks';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Input } from '@/components/ui/input';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const DEF_FILTER = {
  name: '',
  elements: new Set(),
  weaponTypes: new Set(),
};

type PickerProps = {
  ignoreCharacters?: Set<string>;
  onSelect(characterId: string): void;
  disabled?: boolean;
};
function Picker({ onSelect, ignoreCharacters, disabled }: PickerProps) {
  const [filter, setFilter] = useState(() => DEF_FILTER);

  const elements = useElements();
  const weaponTypes = useWeaponTypes();
  const characters = useCharacters();

  const filteredCharacters = useMemo(
    () =>
      characters.filter(
        (c) =>
          (ignoreCharacters === undefined || !ignoreCharacters.has(c.id)) &&
          (filter.elements.size === 0 ||
            !c.element ||
            filter.elements.has(c.element)) &&
          (filter.weaponTypes.size === 0 ||
            filter.weaponTypes.has(c.weaponType)) &&
          (filter.name.length === 0 ||
            fuzzysearch(filter.name.toLowerCase(), c.name.toLowerCase())),
      ),
    [characters, ignoreCharacters, filter],
  );

  return (
    <ScrollArea>
      <div className="p-1 flex flex-col gap-2">
        <div className="flex justify-between items-center gap-4">
          <Input
            autoFocus
            placeholder="Search..."
            type="search"
            value={filter.name}
            onChange={(e) => setFilter((f) => ({ ...f, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredCharacters.length > 0) {
                onSelect(filteredCharacters[0].id);
              }
            }}
          />
        </div>
        <div className="flex flex-wrap gap-y-1 gap-x-2">
          {elements.map((element) => (
            <Button
              key={element.id}
              variant={
                filter.elements.has(element.id) ? 'secondary' : 'outline'
              }
              size="sm"
              onClick={() => {
                if (filter.elements.has(element.id)) {
                  setFilter((f) => {
                    const elements = new Set(f.elements);
                    elements.delete(element.id);
                    return { ...f, elements };
                  });
                } else {
                  setFilter((f) => {
                    const elements = new Set(f.elements);
                    elements.add(element.id);
                    return { ...f, elements };
                  });
                }
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
                filter.weaponTypes.has(weaponType.id) ? 'secondary' : 'outline'
              }
              size="sm"
              onClick={() => {
                if (filter.weaponTypes.has(weaponType.id)) {
                  setFilter((f) => {
                    const weaponTypes = new Set(f.weaponTypes);
                    weaponTypes.delete(weaponType.id);
                    return { ...f, weaponTypes };
                  });
                } else {
                  setFilter((f) => {
                    const weaponTypes = new Set(f.weaponTypes);
                    weaponTypes.add(weaponType.id);
                    return { ...f, weaponTypes };
                  });
                }
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
        <div className="min-h-32 max-h-[calc(75svh-12rem)] w-full grid grid-cols-[repeat(auto-fill,_minmax(6.5rem,_1fr))] grid-rows-[auto_auto] gap-2">
          {filteredCharacters.map((ch) => (
            <Button
              variant="secondary"
              key={ch.id}
              className="grid row-span-2 grid-rows-subgrid justify-items-center items-center h-full p-2 relative"
              onClick={() => onSelect(ch.id)}
              disabled={disabled}
            >
              <CollectionAvatar
                record={ch}
                fileName={ch.icon}
                name={ch.name}
                className="size-26"
              />
              <span className="text-xs text-wrap">{ch.name}</span>
              <div
                className={cn('absolute top-1 right-1 size-4 rounded-lg', {
                  'bg-amber-400': ch.rarity === 5,
                  'bg-indigo-300': ch.rarity !== 5,
                })}
              />
            </Button>
          ))}
        </div>
        <ScrollBar />
      </div>
    </ScrollArea>
  );
}

type Props = PropsWithChildren<
  PickerProps & {
    title: string;
  }
>;
export function CharacterPicker({
  title,
  onSelect,
  ignoreCharacters,
  children,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  const select = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      trigger={children}
      title={title}
      description="Pick Character"
      contentClassName="lg:max-w-3xl max-h-[calc(100%-4rem)] top-8 translate-y-0 overflow-hidden p-5"
    >
      <Picker
        onSelect={select}
        ignoreCharacters={ignoreCharacters}
        disabled={disabled}
      />
    </ResponsiveDialog>
  );
}
