import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

import { CharacterInfo } from './ui/character-info';
import { TalentsInfo } from './ui/talents-info';

export function BuildInfo() {
  return (
    <Card className="w-fit min-w-md">
      <CardTitle className="p-4 flex gap-16">
        <div className="w-full flex items-start gap-3">
          <Avatar className="size-16">
            <AvatarImage src="http://127.0.0.1:8090/api/files/pbc_3298390430/wu4w979kwa1i3s9/diluc_9iy4pbxzgr.webp?token=" />
            <AvatarFallback>D</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 flex-1">
            <div className="w-full flex gap-1 justify-between items-center">
              <span className="truncate font-semibold text-4xl">Dilluc</span>
              <CharacterInfo />
            </div>
            <div className="flex gap-1">
              <Badge>Level 90</Badge>
              <Badge>C 2</Badge>
            </div>
          </div>
        </div>
      </CardTitle>
      <CardContent>
        <TalentsInfo />
      </CardContent>
    </Card>
  );
}
