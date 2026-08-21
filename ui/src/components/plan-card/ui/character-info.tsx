import { useWeaponTypesItem } from '@/api/dictionaries/hooks';
import { Characters } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { useElementScope } from '@/hooks/use-element-scope';
import { cn } from '@/lib/utils';

type CharacterInfoContentProps = { character: Characters };
export function CharacterInfoContent({ character }: CharacterInfoContentProps) {
  const { element, style } = useElementScope(character.element);
  const weaponType = useWeaponTypesItem(character.weaponType);

  if (!element || !weaponType) {
    return null;
  }

  return (
    <div
      className="element-scope grid min-w-40 grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-sm"
      style={style}
    >
      <span className="text-xs text-muted-foreground">Rarity</span>
      <Badge
        className={cn(
          'w-fit gap-0.5',
          character.rarity === 5
            ? 'bg-rarity-5/18 text-rarity-5 ring-1 ring-rarity-5/30'
            : 'bg-rarity-4/18 text-rarity-4 ring-1 ring-rarity-4/30',
        )}
      >
        {character.rarity} star
      </Badge>
      <span className="text-xs text-muted-foreground">Element</span>
      <Badge className="w-fit gap-1 bg-element/18 text-element-fg ring-1 ring-element/30">
        <CollectionAvatar
          record={element}
          fileName={element.icon}
          name={element.name}
          className="size-4"
        />
        {element.name}
      </Badge>
      <span className="text-xs text-muted-foreground">Weapon</span>
      <Badge variant="secondary" className="flex w-fit gap-1">
        <CollectionAvatar
          record={weaponType}
          fileName={weaponType.icon}
          name={weaponType.name}
          className="size-4 not-dark:invert"
        />
        {weaponType.name}
      </Badge>
    </div>
  );
}
