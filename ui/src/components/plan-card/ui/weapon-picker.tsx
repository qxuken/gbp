import fuzzysearch from 'fuzzysearch';
import { PropsWithChildren, useMemo, useState } from 'react';

import { useWeapons, useWeaponTypes } from '@/api/dictionaries/hooks';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Input } from '@/components/ui/input';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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

  const weaponTypes = useWeaponTypes();
  const weapons = useWeapons();
  const filteredWeapons = useMemo(
    () =>
      weapons.filter(
        (w) =>
          w.rarity >= 3 &&
          (ignoreWeapons === undefined || !ignoreWeapons.has(w.id)) &&
          (weaponTypeId === undefined || w.weaponType === weaponTypeId) &&
          (filter.weaponTypes.size === 0 ||
            filter.weaponTypes.has(w.weaponType)) &&
          (filter.name.length === 0 ||
            fuzzysearch(filter.name.toLowerCase(), w.name.toLowerCase())),
      ),
    [weapons, ignoreWeapons, filter],
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
              if (e.key === 'Enter' && filteredWeapons.length > 0) {
                onSelect(filteredWeapons[0].id);
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
        <div className="min-h-32 max-h-[calc(80svh-12rem)] w-full grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] grid-rows-[auto_auto] gap-2">
          {filteredWeapons.map((w) => (
            <Button
              variant="ghost"
              key={w.id}
              className="relative row-span-2 grid h-full grid-rows-subgrid items-center justify-items-center gap-1 rounded-lg border border-border/70 bg-muted/35 p-2 transition-colors hover:border-border hover:bg-muted/70"
              onClick={() => onSelect(w.id)}
            >
              <CollectionAvatar
                record={w}
                fileName={w.icon}
                name={w.name}
                className="size-24 rounded-lg"
              />
              <span className="text-xs leading-tight text-balance">
                {w.name}
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
      contentClassName="lg:max-w-3xl max-h-[calc(100%-4rem)] top-8 translate-y-0 overflow-hidden p-5"
    >
      <Picker
        onSelect={select}
        weaponTypeId={weaponTypeId}
        ignoreWeapons={ignoreWeapons}
      />
    </ResponsiveDialog>
  );
}
