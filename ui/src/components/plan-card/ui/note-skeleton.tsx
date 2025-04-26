import { Skeleton } from '@/components/ui/skeleton';

export function NoteSkeleton() {
  return (
    <div className="mt-1 w-full grid gap-2">
      <Skeleton className="h-5 w-24 rounded-md justify-self-center" />
    </div>
  );
}
