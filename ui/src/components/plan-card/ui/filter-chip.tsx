import { CSSProperties } from 'react';

import { Elements, WeaponTypes } from '@/api/types';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { cn } from '@/lib/utils';

/* Filter chips all share one shape; only the active fill differs. */
export const CHIP =
  'inline-flex items-center rounded-md border font-medium transition-colors disabled:pointer-events-none disabled:opacity-30';

/**
 * `sm` packs a lot of chips into the filter sidebar; `md` is for the pickers,
 * where the dialog has room and the chips are the first thing you reach for.
 */
const SIZES = {
  sm: { chip: 'gap-1.5 px-2 py-1 text-xs', icon: 'size-3.5' },
  md: { chip: 'gap-2 px-3 py-1.5 text-sm', icon: 'size-4' },
};

type ChipProps = {
  active: boolean;
  disabled?: boolean;
  size?: keyof typeof SIZES;
  onClick(): void;
};

/** Element toggle — tinted by the element it stands for, wherever it appears. */
export function ElementChip({
  element,
  active,
  disabled,
  size = 'sm',
  onClick,
}: ChipProps & { element: Elements }) {
  return (
    <button
      type="button"
      style={{ '--element': element.color } as CSSProperties}
      className={cn(
        CHIP,
        SIZES[size].chip,
        'element-scope',
        active
          ? 'border-element/50 bg-element/20 text-element-fg'
          : 'border-border text-muted-foreground hover:border-element/40 hover:bg-element/10 hover:text-element-fg',
        !active && size === 'md' && 'bg-card shadow-sm',
      )}
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
    >
      <CollectionAvatar
        record={element}
        fileName={element.icon}
        name={element.name}
        className={SIZES[size].icon}
      />
      {element.name}
    </button>
  );
}

/** Weapon type toggle — no colour of its own, so it leans on the foreground. */
export function WeaponTypeChip({
  weaponType,
  active,
  disabled,
  size = 'sm',
  onClick,
}: ChipProps & { weaponType: WeaponTypes }) {
  return (
    <button
      type="button"
      className={cn(
        CHIP,
        SIZES[size].chip,
        active
          ? 'border-foreground/25 bg-foreground/8 text-foreground'
          : 'border-border text-muted-foreground hover:border-foreground/20 hover:bg-foreground/5 hover:text-foreground',
        !active && size === 'md' && 'bg-card shadow-sm',
      )}
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
    >
      <CollectionAvatar
        record={weaponType}
        fileName={weaponType.icon}
        name={weaponType.name}
        className={cn(SIZES[size].icon, 'not-dark:invert')}
      />
      {weaponType.name}
    </button>
  );
}
