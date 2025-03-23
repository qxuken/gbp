import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { Button } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type TBuildFilter = {
  name: string;
  elements: Set<string>;
  weaponTypes: Set<string>;
  characters: Set<string>;
};
type Props = TBuildFilter & {
  availableElements: Set<string>;
  availableWeaponTypes: Set<string>;
  availableCharacters: Set<string>;
  onChange(v: Partial<TBuildFilter>): void;
};

export function BuildFilters(props: Props) {
  const elements = useLiveQuery(() => db.elements.toArray(), []);
  const weaponTypes = useLiveQuery(() => db.weaponTypes.toArray(), []);
  return (
    <section
      aria-label="Filters"
      className="p-3 grid gap-2 min-w-xs border border-border border-dashed rounded-xl"
    >
      <div className="grid gap-2">
        <Label htmlFor="name">Search</Label>
        <Input
          id="name"
          type="text"
          placeholder="Search"
          value={props.name}
          onChange={(e) => props.onChange({ name: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap gap-y-1 gap-x-2">
        {elements?.map((element) => (
          <Button
            key={element.id}
            variant={props.elements.has(element.id) ? 'secondary' : 'outline'}
            size="sm"
            disabled={!props.availableElements.has(element.id)}
            onClick={() => {
              const elements = new Set(props.elements);
              if (elements.has(element.id)) {
                elements.delete(element.id);
                props.onChange({ elements });
              } else {
                elements.add(element.id);
                props.onChange({ elements });
              }
            }}
          >
            <CollectionAvatar
              record={element}
              fileName={element.icon}
              name={element.name}
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
              props.weaponTypes.has(weaponType.id) ? 'secondary' : 'outline'
            }
            size="sm"
            disabled={!props.availableWeaponTypes.has(weaponType.id)}
            onClick={() => {
              const weaponTypes = new Set(props.weaponTypes);
              if (weaponTypes.has(weaponType.id)) {
                weaponTypes.delete(weaponType.id);
                props.onChange({ weaponTypes });
              } else {
                weaponTypes.add(weaponType.id);
                props.onChange({ weaponTypes });
              }
            }}
          >
            <CollectionAvatar
              record={weaponType}
              fileName={weaponType.icon}
              name={weaponType.name}
              className="size-4 not-dark:bg-black"
            />
            {weaponType.name}
          </Button>
        ))}
      </div>
    </section>
  );
}
