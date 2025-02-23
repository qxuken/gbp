import { createFileRoute } from '@tanstack/react-router';

import { BuildInfo } from '@/components/build-card/build-info';
import { CreateBuild } from '@/components/build-card/create-build';

export const Route = createFileRoute('/_protected/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="p-2 flex flex-wrap gap-4 justify-center">
      <BuildInfo />
      <BuildInfo />
      <BuildInfo />
      <BuildInfo />
      <BuildInfo />
      <CreateBuild />
    </div>
  );
}
