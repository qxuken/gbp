import { useLiveQuery } from 'dexie-react-hooks';
import fuzzysearch from 'fuzzysearch';
import { PropsWithChildren, useState } from 'react';

import { db } from '@/api/dictionaries/db';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Input } from '@/components/ui/input';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const DEF_FILTER = {
  name: '',
  weaponTypes: new Set(),
};

type PickerProps = {
  weaponTypeId?: string;
  ignoreWeapons?: Set<string>;
  onSelect(weaponId: string): void;
};

function Picker({ weaponTypeId, ignoreWeapons, onSelect }: PickerProps) {
  const [filter, setFilter] = useState(() => DEF_FILTER);

  const weaponTypes = useLiveQuery(() => db.weaponTypes.toArray(), []);
  const weapons = useLiveQuery(
    () =>
      db.weapons
        .orderBy('rarity')
        .filter(
          (w) =>
            w.rarity >= 3 &&
            (ignoreWeapons === undefined || !ignoreWeapons.has(w.id)) &&
            (weaponTypeId === undefined || w.weaponType === weaponTypeId) &&
            (filter.weaponTypes.size === 0 ||
              filter.weaponTypes.has(w.weaponType)) &&
            (filter.name.length === 0 ||
              fuzzysearch(filter.name.toLowerCase(), w.name.toLowerCase())),
        )
        .reverse()
        .toArray(),
    [filter, weaponTypeId],
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
              if (e.key === 'Enter' && weapons && weapons.length > 0) {
                onSelect(weapons[0].id);
              }
            }}
          />
        </div>
        {weaponTypeId === undefined && (
          <div className="flex flex-wrap gap-y-1 gap-x-2">
            {weaponTypes?.map((weaponType) => (
              <Button
                key={weaponType.id}
                variant={
                  filter.weaponTypes.has(weaponType.id)
                    ? 'secondary'
                    : 'outline'
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
                  className="size-4"
                />
                {weaponType.name}
              </Button>
            ))}
          </div>
        )}
        <div className="min-h-32 max-h-[calc(90svh-12rem)] w-full grid grid-cols-[repeat(auto-fill,_minmax(6.5rem,_1fr))] grid-rows-[auto_auto] gap-2">
          {weapons?.map((w) => (
            <Button
              variant="secondary"
              key={w.id}
              className="grid row-span-2 grid-rows-subgrid justify-items-center items-center h-full p-2 relative"
              onClick={() => onSelect(w.id)}
            >
              <CollectionAvatar
                record={w}
                fileName={w.icon}
                name={w.name}
                className="size-26"
              />
              <span className="text-xs text-wrap">{w.name}</span>
              <div
                className={cn('absolute top-1 right-1 size-4 rounded-lg', {
                  'bg-amber-400': w.rarity === 5,
                  'bg-indigo-300': w.rarity !== 5,
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
export function WeaponPicker({
  title,
  weaponTypeId,
  ignoreWeapons,
  onSelect,
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
      description="Pick Weapon"
      contentClassName="md:max-w-3xl max-h-[calc(100%-4rem)] top-8 translate-y-0 overflow-hidden p-5"
    >
      <Picker
        onSelect={select}
        weaponTypeId={weaponTypeId}
        ignoreWeapons={ignoreWeapons}
      />
    </ResponsiveDialog>
  );
}
