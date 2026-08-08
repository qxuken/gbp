import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  isUiPlansMode,
  UiPlansMode,
  useUiPlansConfigMode,
} from '@/store/ui-plans-config';

export function PlanMode() {
  const [mode, setMode] = useUiPlansConfigMode();
  const onChange = (value: string) => {
    if (isUiPlansMode(value)) {
      setMode(value);
    }
  };
  return (
    <section
      aria-label="Plans Ui Mode"
      className="p-3 grid gap-2 min-w-xs bg-background border border-border border-dashed rounded-xl"
    >
      <div className="flex w-full items-center gap-4">
        <span>Cards view</span>
        <Tabs value={mode} onValueChange={onChange} className="flex-1">
          <TabsList className="w-full">
            <TabsTrigger value={UiPlansMode.Full}>Full</TabsTrigger>
            <TabsTrigger value={UiPlansMode.Short}>Short</TabsTrigger>
            <TabsTrigger value={UiPlansMode.V2}>V2</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}

export default PlanMode;
