import { useLiveQuery } from 'dexie-react-hooks';
import fuzzysearch from 'fuzzysearch';
import { PropsWithChildren, useEffect, useState } from 'react';

import { db } from '@/api/dictionaries-db';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const DEF_FILTER = {
  name: '',
  weaponTypes: new Set(),
};

type Props = PropsWithChildren<{
  title: string;
  onSelect(weaponId: string): void;
}>;
export function WeaponPicker({ title, onSelect, children }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState(() => DEF_FILTER);

  useEffect(() => {
    setFilter(DEF_FILTER);
  }, [open]);

  const weaponTypes = useLiveQuery(() => db.weaponTypes.toArray(), []);
  const weapons = useLiveQuery(
    () =>
      db.weapons
        .orderBy('name')
        .filter(
          (c) =>
            (filter.weaponTypes.size === 0 ||
              filter.weaponTypes.has(c.weapon_type)) &&
            fuzzysearch(filter.name.toLowerCase(), c.name.toLowerCase()),
        )
        .toArray(),
    [filter],
  );

  const select = (characterId: string) => {
    onSelect(characterId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="md:max-w-3xl max-h-[calc(100%-4rem)] top-8 translate-y-0 overflow-hidden p-5">
        <DialogHeader className="p-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Pick Weapon</DialogDescription>
        </DialogHeader>
        <ScrollArea>
          <div className="p-1 flex flex-col gap-2">
            <div className="flex justify-between items-center gap-4">
              <Input
                autoFocus
                placeholder="Search..."
                type="search"
                value={filter.name}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, name: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && weapons && weapons.length > 0) {
                    select(weapons[0].id);
                  }
                }}
              />
            </div>
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
                    collectionName="weaponTypes"
                    recordId={weaponType.id}
                    fileName={weaponType.icon}
                    name={weaponType.name}
                    size={16}
                    className="size-4"
                  />
                  {weaponType.name}
                </Button>
              ))}
            </div>
            <div className="min-h-32 max-h-[calc(70svh-12rem)] w-full grid grid-cols-4 md:grid-cols-6 grid-rows-[auto_auto] gap-2">
              {weapons?.map((w) => (
                <Button
                  variant="secondary"
                  key={w.id}
                  className="grid row-span-2 grid-rows-subgrid justify-items-center items-center h-full p-2 relative"
                  onClick={() => select(w.id)}
                >
                  <CollectionAvatar
                    collectionName="weapons"
                    recordId={w.id}
                    fileName={w.icon}
                    name={w.name}
                    size={64}
                    className="size-16"
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
      </DialogContent>
    </Dialog>
  );
}
