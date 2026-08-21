import fuzzysearch from 'fuzzysearch';
import { PropsWithChildren, useMemo, useState } from 'react';

import { useArtifactSets } from '@/api/dictionaries/hooks';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Input } from '@/components/ui/input';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
