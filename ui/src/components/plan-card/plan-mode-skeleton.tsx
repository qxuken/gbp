import { Skeleton } from '@/components/ui/skeleton';

export default function PlansModeSkeleton() {
  return (
    <section
      aria-label="Filters"
      className="p-3 grid gap-2 min-w-xs border border-border border-dashed rounded-xl"
    >
      <div className="flex gap-2 items-center">
        <Skeleton className="h-6 w-29 rounded-md" />
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </section>
  );
}
