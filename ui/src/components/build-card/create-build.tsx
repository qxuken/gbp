import { Card } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Icons } from '../icons';

export function CreateBuild() {
  return (
    <Card className='w-fit min-w-xs opacity-80'>
      <Button className='size-full' size="icon" variant="ghost">
        <Icons.new />
        <span>Create new build</span>
      </Button>
    </Card>
  );
}
