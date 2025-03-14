import { useLiveQuery } from 'dexie-react-hooks';
import fuzzysearch from 'fuzzysearch';
import { PropsWithChildren, useState } from 'react';

import { db } from '@/api/dictionaries-db';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Button } from '@/components/ui/button';
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
};
function Picker({ onSelect, ignoreCharacters }: PickerProps) {
  const [filter, setFilter] = useState(() => DEF_FILTER);

  const elements = useLiveQuery(() => db.elements.toArray(), []);
  const weaponTypes = useLiveQuery(() => db.weaponTypes.toArray(), []);
  const characters = useLiveQuery(
    () =>
      db.characters
        .orderBy('rarity')
        .filter(
          (c) =>
            (ignoreCharacters === undefined || !ignoreCharacters.has(c.id)) &&
            (filter.elements.size === 0 ||
              !c.element ||
              filter.elements.has(c.element)) &&
            (filter.weaponTypes.size === 0 ||
              filter.weaponTypes.has(c.weaponType)) &&
            (filter.name.length === 0 ||
              fuzzysearch(filter.name.toLowerCase(), c.name.toLowerCase())),
        )
        .reverse()
        .toArray(),
    [filter],
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
              if (e.key === 'Enter' && characters && characters.length > 0) {
                onSelect(characters[0].id);
              }
            }}
          />
        </div>
        <div className="flex flex-wrap gap-y-1 gap-x-2">
          {elements?.map((element) => (
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
                size={16}
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
                size={16}
                className="size-4 not-dark:bg-black"
              />
              {weaponType.name}
            </Button>
          ))}
        </div>
        <div className="min-h-32 max-h-[calc(75svh-12rem)] w-full grid grid-cols-[repeat(auto-fill,_minmax(6.5rem,_1fr))] grid-rows-[auto_auto] gap-2">
          {characters?.map((ch) => (
            <Button
              variant="secondary"
              key={ch.id}
              className="grid row-span-2 grid-rows-subgrid justify-items-center items-center h-full p-2 relative"
              onClick={() => onSelect(ch.id)}
            >
              <CollectionAvatar
                record={ch}
                fileName={ch.icon}
                name={ch.name}
                size={104}
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
      contentClassName="md:max-w-3xl max-h-[calc(100%-4rem)] top-8 translate-y-0 overflow-hidden p-5"
    >
      <Picker onSelect={select} ignoreCharacters={ignoreCharacters} />
    </ResponsiveDialog>
  );
}
