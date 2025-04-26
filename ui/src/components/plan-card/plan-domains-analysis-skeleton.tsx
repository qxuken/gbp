import { Skeleton } from '@/components/ui/skeleton';

export default function PlanDomainsAnalysisSkeleton() {
  return (
    <section
      aria-label="Filters"
      className="p-3 grid gap-2 min-w-xs border border-border border-dashed rounded-xl"
    >
      <div className="flex justify-between gap-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <div className="w-10 flex justify-center">
          <Skeleton className="size-5 rounded-md" />
        </div>
      </div>
      <div className="grid gap-2">
        <BuildDomainsAnalysisContentSkeleton />
      </div>
    </section>
  );
}

export function BuildDomainsAnalysisContentSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="pt-1 pb-2 px-2 bg-accent/50 rounded-lg">
        <div className="flex gap-1">
          {[1, 2].map((j) => (
            <Skeleton key={j} className="size-10 rounded-2xl" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <Skeleton className="h-3 w-10 rounded-md" />
          <Skeleton className="h-3 w-10 rounded-md" />
          <Skeleton className="h-3 w-10 rounded-md" />
        </div>
      </div>
      <div className="pt-1 pb-2 px-2 bg-accent rounded-lg">
        <div className="flex gap-1">
          <Skeleton className="size-10 rounded-2xl" />
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}
