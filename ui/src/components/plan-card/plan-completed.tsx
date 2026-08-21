import { motion } from 'motion/react';
import { useId } from 'react';

import { cn } from '@/lib/utils';
import { useFiltersSelector, useSetFilters } from '@/store/plans/filters';

const OPTIONS = [
  { value: false, label: 'Hide' },
  { value: true, label: 'Show' },
];

export function PlanCompleted() {
  const isComplete = useFiltersSelector('complete');
  const setFilters = useSetFilters();
  /** Ties the sliding thumb to this instance, so two toggles never share one. */
  const thumbId = useId();

  return (
    <div className="flex w-full items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
        Completed
      </span>
      <div
        role="radiogroup"
        aria-label="Show completed builds"
        className="flex h-7 flex-1 items-stretch rounded-md bg-muted p-0.5"
      >
        {OPTIONS.map((option) => {
          const active = isComplete === option.value;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={active}
              className={cn(
                'relative flex flex-1 items-center justify-center rounded-sm px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() =>
                setFilters((filters) => {
                  filters.complete = option.value;
                })
              }
            >
              {active && (
                <motion.span
                  layoutId={thumbId}
                  className="absolute inset-0 rounded-sm bg-background shadow-sm dark:bg-accent dark:shadow-none dark:ring-1 dark:ring-border"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PlanCompleted;
