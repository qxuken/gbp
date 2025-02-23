import { Icons } from '@/components/icons';
import { Card } from '@/components/ui/card';

import { Button } from '../ui/button';

export function CreateBuild() {
  return (
    <Card className="w-fit min-w-md opacity-80">
      <Button className="size-full" size="icon" variant="ghost">
        <Icons.new />
        <span>Create new build</span>
      </Button>
    </Card>
  );
}
