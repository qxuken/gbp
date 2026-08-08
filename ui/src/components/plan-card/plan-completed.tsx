import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFiltersSelector, useSetFilters } from '@/store/plans/filters';

export function PlanCompleted() {
  const isComplete = useFiltersSelector('complete');
  const setFilters = useSetFilters();

  return (
    <section
      aria-label="Completed Flag"
      className="p-3 grid gap-2 min-w-xs bg-background border border-border border-dashed rounded-xl"
    >
      <div className="flex w-full items-center gap-4">
        <span>Completed</span>
        <Tabs
          value={isComplete ? 'show' : 'hide'}
          onValueChange={(value) => {
            setFilters((filters) => {
              filters.complete = value == 'show';
            });
          }}
          className="flex-1"
        >
          <TabsList className="w-full">
            <TabsTrigger value={'hide'}>Hide</TabsTrigger>
            <TabsTrigger value={'show'}>Show</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}

export default PlanCompleted;
