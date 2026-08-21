import { ComponentType, PropsWithChildren, ReactNode } from 'react';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SectionHeaderProps = PropsWithChildren<{
  icon: ComponentType<{ className?: string }>;
  title: string;
  /** Rendered right after the title — normally the add button. */
  action?: ReactNode;
  isError?: boolean;
  retry?: () => void;
  disabled?: boolean;
  className?: string;
}>;

/**
 * One consistent header for every section of a plan card: element-tinted icon,
 * small caps label, then the section's own affordances.
 */
export function SectionHeader({
  icon: Icon,
  title,
  action,
  isError,
  retry,
  disabled,
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex min-h-6 items-center gap-1.5', className)}>
      <Icon
        className={cn('size-3.5 shrink-0 text-element-fg/85', {
          'text-destructive': isError,
        })}
      />
      <span
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground',
          { 'text-destructive': isError },
        )}
      >
        {title}
      </span>
      {action}
      <div className="flex-1" />
      {children}
      {isError && retry && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs text-destructive"
          onClick={retry}
          disabled={disabled}
        >
          <Icons.Retry className="size-3" />
          Retry
        </Button>
      )}
    </div>
  );
}

/** The small `+` that sits next to a section title. */
export function SectionAddButton({
  disabled,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  if (disabled) {
    return null;
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'size-5 rounded-md text-muted-foreground transition-colors hover:bg-element/15 hover:text-element-fg focus-visible:bg-element/15 focus-visible:text-element-fg disabled:opacity-30',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <Icons.Add className="size-3.5" />
    </Button>
  );
}

/**
 * A value that can be taken back out — a substat, a main stat, a filter. It
 * reads as plain text until hovered, then turns red to say it is about to go,
 * so removal never needs its own permanent chrome or any reserved space.
 */
export function RemovableChip({
  className,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex max-w-full items-center rounded-md border border-transparent px-1.5 py-0.5 text-sm leading-tight font-medium whitespace-normal transition-colors',
        'hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive',
        'focus-visible:border-destructive/40 focus-visible:bg-destructive/10 focus-visible:text-destructive focus-visible:outline-none',
        'data-[state=open]:border-destructive/40 data-[state=open]:bg-destructive/10 data-[state=open]:text-destructive',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Dashed placeholder shown where a section has nothing in it yet. */
export function SectionEmpty({ children }: PropsWithChildren) {
  return (
    <p className="rounded-lg border border-dashed border-border/70 px-2.5 py-2 text-xs text-muted-foreground/70">
      {children}
    </p>
  );
}
