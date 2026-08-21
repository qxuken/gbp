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

import { ElementChip, WeaponTypeChip } from './filter-chip';

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
        <div className="flex flex-wrap gap-x-2 gap-y-1.5">
          {elements.map((element) => (
            <ElementChip
              key={element.id}
              element={element}
              size="md"
              active={filter.elements.has(element.id)}
              onClick={() =>
                setFilter((f) => {
                  const elements = new Set(f.elements);
                  if (elements.has(element.id)) {
                    elements.delete(element.id);
                  } else {
                    elements.add(element.id);
                  }
                  return { ...f, elements };
                })
              }
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1.5">
          {weaponTypes?.map((weaponType) => (
            <WeaponTypeChip
              key={weaponType.id}
              weaponType={weaponType}
              size="md"
              active={filter.weaponTypes.has(weaponType.id)}
              onClick={() =>
                setFilter((f) => {
                  const weaponTypes = new Set(f.weaponTypes);
                  if (weaponTypes.has(weaponType.id)) {
                    weaponTypes.delete(weaponType.id);
                  } else {
                    weaponTypes.add(weaponType.id);
                  }
                  return { ...f, weaponTypes };
                })
              }
            />
          ))}
        </div>
        <div className="min-h-32 max-h-[calc(70svh-12rem)] w-full grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] grid-rows-[auto_auto] gap-2">
          {filteredCharacters.map((ch) => (
            <Button
              variant="ghost"
              key={ch.id}
              className="relative row-span-2 grid h-full grid-rows-subgrid items-center justify-items-center gap-1 rounded-lg border border-border/70 bg-muted/35 p-2 transition-colors hover:border-border hover:bg-muted/70"
              onClick={() => onSelect(ch.id)}
              disabled={disabled}
            >
              <CollectionAvatar
                record={ch}
                fileName={ch.icon}
                name={ch.name}
                className="size-24 rounded-lg"
              />
              <span className="text-xs leading-tight text-balance">
                {ch.name}
              </span>
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
