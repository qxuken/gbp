import { Trigger as SelectTrigger } from '@radix-ui/react-select';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { Specials } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

function isSubstatSpecial(special: Specials) {
  return special.substat === 1;
}

type Props = { substats?: string[]; mutate?: (v: string[]) => void };
export function ArtifactSubstats({ substats, mutate }: Props) {
  if (!substats || !mutate) {
    return <ArtifactSubstatsSkeleton />;
  }
  return <ArtifactSubstatsLoaded substats={substats} mutate={mutate} />;
}

type PropsLoaded = Required<Props>;
function ArtifactSubstatsLoaded({ substats, mutate }: PropsLoaded) {
  const selected = useLiveQuery(
    () =>
      db.specials
        .bulkGet(substats)
        .then((r) => r.filter((it) => it != undefined)),
    [substats],
    [] as Specials[],
  );
  const specials = useLiveQuery(
    () => db.specials.orderBy('order').filter(isSubstatSpecial).toArray(),
    [],
  );
  const selectedIds = new Set(selected.map((s) => s.id));
  const options = specials?.filter((s) => !selectedIds.has(s.id));

  const addSpecial = (specialId: string) => {
    mutate([...substats, specialId]);
  };

  const deleteSpecial = (specialId: string) => {
    mutate(substats.filter((id) => id != specialId));
  };

  return (
    <div>
      <span className="text-xs text-muted-foreground">Substats</span>
      <div className="flex flex-wrap gap-1 items-start">
        {selected.map((special, i) => {
          return (
            <div key={special.id} className="flex gap-1 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-md after:text-gray-400 cursor-pointer hover:line-through focus:line-through">
                    {special.name}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="top">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => deleteSpecial(special.id)}
                  >
                    Yes i really want to delete
                  </Button>
                </PopoverContent>
              </Popover>
              {selected.length - 1 !== i && (
                <Icons.Divide className="text-gray-400 size-4" />
              )}
            </div>
          );
        })}
        {options && options.length > 0 && (
          <Select onValueChange={(special) => addSpecial(special)} value="">
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
}

export function ArtifactSubstatsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-9 rounded-md" />
      <div className="flex flex-wrap gap-1 items-start">
        <Skeleton className="h-4 w-10 rounded-md" />
        <Skeleton className="size-4 rounded-md" />
      </div>
    </div>
  );
}
