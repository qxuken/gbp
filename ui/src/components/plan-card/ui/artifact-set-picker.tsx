import fuzzysearch from 'fuzzysearch';
import { PropsWithChildren, useMemo, useState } from 'react';

import { useArtifactSets } from '@/api/dictionaries/hooks';
import { Icons } from '@/components/icons';
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
  ignoreArtifacts?: Set<string>;
};
function Picker({ onSelect, ignoreArtifacts }: PickerProps) {
  const [filter, setFilter] = useState(() => DEF_FILTER);
  const artifactSets = useArtifactSets();

  const filteredArtifactSets = useMemo(
    () =>
      artifactSets.filter(
        (as) =>
          as.rarity > 3 &&
          (ignoreArtifacts === undefined || !ignoreArtifacts.has(as.id)) &&
          (filter.name.length === 0 ||
            fuzzysearch(filter.name.toLowerCase(), as.name.toLowerCase())),
      ),
    [artifactSets, filter],
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
              if (e.key === 'Enter' && filteredArtifactSets.length > 0) {
                onSelect(filteredArtifactSets[0].id);
              }
            }}
          />
        </div>
        <div className="min-h-32 max-h-[calc(80svh-12rem)] w-full grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] grid-rows-[auto_auto] gap-2">
          {filteredArtifactSets.map((w) => (
            <Button
              variant="ghost"
              key={w.id}
              className={cn(
                'relative row-span-2 grid h-full grid-rows-subgrid items-center justify-items-center gap-1 rounded-xl border p-2',
                w.rarity === 5
                  ? 'border-rarity-5/40 bg-rarity-5/8 hover:bg-rarity-5/16'
                  : w.rarity === 4
                    ? 'border-rarity-4/35 bg-rarity-4/8 hover:bg-rarity-4/16'
                    : 'border-border bg-muted/40 hover:bg-muted',
              )}
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
              <span
                className={cn(
                  'absolute top-1 right-1 inline-flex items-center gap-0.5 rounded-full px-1 text-[10px] font-bold tabular-nums',
                  w.rarity === 5
                    ? 'text-rarity-5'
                    : w.rarity === 4
                      ? 'text-rarity-4'
                      : 'text-muted-foreground',
                )}
              >
                <Icons.Star className="size-2.5 fill-current" />
                {w.rarity}
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
export function ArtifactSetPicker({
  title,
  onSelect,
  ignoreArtifacts,
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
      contentClassName="lg:max-w-3xl max-h-[calc(100%-4rem)] top-8 translate-y-0 overflow-hidden p-5"
    >
      <Picker onSelect={select} ignoreArtifacts={ignoreArtifacts} />
    </ResponsiveDialog>
  );
}
