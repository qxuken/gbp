import { CreateBuild } from '@/components/build-card/create-build';
import { BuildInfo } from '@/components/build-card/build-info';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="p-2 grid gap-4 grid-flow-row-dense grid-cols-3 grid-rows-3">
      <BuildInfo />
      <BuildInfo />
      <BuildInfo />
      <BuildInfo />
      <BuildInfo />
      <CreateBuild />
    </div>
  );
}
