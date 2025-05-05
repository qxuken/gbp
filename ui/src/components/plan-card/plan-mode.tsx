import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UiPlansMode, useUiPlansConfigMode } from '@/store/ui-plans-config';

export function PlanMode() {
  const [mode, setMode] = useUiPlansConfigMode();
  const onChange = (value: string) => {
    if (value == UiPlansMode.Full || value == UiPlansMode.Short) {
      setMode(value);
    }
  };
  return (
    <section
      aria-label="Plans Ui Mode"
      className="p-3 grid gap-2 min-w-xs border border-border border-dashed rounded-xl"
    >
      <div className="flex gap-2 w-full items-center">
        <span>Cards view</span>
        <Tabs value={mode} onValueChange={onChange} className="flex-1">
          <TabsList className="w-full">
            <TabsTrigger value={UiPlansMode.Full}>Full</TabsTrigger>
            <TabsTrigger value={UiPlansMode.Short}>Short</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}

export default PlanMode;
