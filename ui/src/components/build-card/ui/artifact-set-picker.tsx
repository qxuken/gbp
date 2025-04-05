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
};

type PickerProps = {
  onSelect(weaponId: string): void;
  ignoreArifacts?: Set<string>;
};
function Picker({ onSelect, ignoreArifacts }: PickerProps) {
  const [filter, setFilter] = useState(() => DEF_FILTER);

  const artifactSets = useLiveQuery(
    () =>
      db.artifactSets
        .orderBy('rarity')
        .filter(
          (as) =>
            as.rarity > 3 &&
            (ignoreArifacts === undefined || !ignoreArifacts.has(as.id)) &&
            (filter.name.length === 0 ||
              fuzzysearch(filter.name.toLowerCase(), as.name.toLowerCase())),
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
              if (
                e.key === 'Enter' &&
                artifactSets &&
                artifactSets.length > 0
              ) {
                onSelect(artifactSets[0].id);
              }
            }}
          />
        </div>
        <div className="min-h-32 max-h-[calc(90svh-12rem)] w-full grid grid-cols-[repeat(auto-fill,_minmax(6.5rem,_1fr))] grid-rows-[auto_auto] gap-2">
          {artifactSets?.map((w) => (
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
                  'bg-indigo-300': w.rarity === 4,
                  'bg-gray-400': w.rarity <= 3,
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
export function ArtifactSetPicker({
  title,
  onSelect,
  ignoreArifacts,
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
      description="Pick artifact set"
      contentClassName="md:max-w-3xl max-h-[calc(100%-4rem)] top-8 translate-y-0 overflow-hidden p-5"
    >
      <Picker onSelect={select} ignoreArifacts={ignoreArifacts} />
    </ResponsiveDialog>
  );
}
