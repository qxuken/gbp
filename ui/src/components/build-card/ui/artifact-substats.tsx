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
import { cn } from '@/lib/utils';

type Props = { substats: string[]; mutate(v: string[]): void };
export function ArtifactSubstats({ substats, mutate }: Props) {
  const selected = useLiveQuery(
    () =>
      db.specials
        .bulkGet(substats)
        .then((r) => r.filter((it) => it != undefined)),
    [substats],
    [] as Specials[],
  );
  const specials = useLiveQuery(() => db.specials.toArray(), []);
  const selectedIds = new Set(selected.map((s) => s.id));
  const options = specials?.filter((s) => !selectedIds.has(s.id));

  const addSpecial = (specialId: string) => {
    mutate([...substats, specialId]);
  };

  const deleteSpecial = (specialId: string) => {
    mutate(substats.filter((id) => id != specialId));
  };

  return (
    <div className="group/subs">
      <span className="text-xs text-muted-foreground">Substats</span>
      <div className="flex flex-wrap gap-1 items-start">
        {selected.map((special, i) => {
          return (
            <Popover key={special.id}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'text-md after:text-gray-400 cursor-pointer hover:line-through focus:line-through',
                    {
                      ['after:content-[","]']: selected.length - 1 !== i,
                    },
                  )}
                >
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
          );
        })}
        {options && options.length > 0 && (
          <Select onValueChange={(special) => addSpecial(special)} value="">
            <SelectTrigger data-slot="select-trigger" asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  'size-6 opacity-75 invisible group-hover/subs:visible group-focus-within/subs:visible data-[state=open]:visible hover:opacity-100 focus:opacity-100',
                  {
                    ['visible opacity-50']: selected.length === 0,
                  },
                )}
              >
                <Icons.add />
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
