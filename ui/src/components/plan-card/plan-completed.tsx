import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFiltersSelector, useSetFilters } from '@/store/plans/filters';

export function PlanCompleted() {
  const isComplete = useFiltersSelector('complete');
  const setFilters = useSetFilters();

  return (
    <div className="flex w-full items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
        Built
      </span>
      <Tabs
        value={isComplete ? 'show' : 'hide'}
        onValueChange={(value) => {
          setFilters((filters) => {
            filters.complete = value == 'show';
          });
        }}
        className="flex-1"
      >
        <TabsList className="h-7 w-full p-0.5">
          <TabsTrigger value={'hide'} className="text-xs">
            Hide
          </TabsTrigger>
          <TabsTrigger value={'show'} className="text-xs">
            Show
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

export default PlanCompleted;
