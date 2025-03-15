import { RecordModel } from 'pocketbase';

import { pbClient } from '@/api/pocketbase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getShortName } from '@/lib/utils';

type Props = Parameters<typeof Avatar>[0] & {
  record: RecordModel;
  fileName: string;
  name: string;
};

export function CollectionAvatar({ record, fileName, name, ...props }: Props) {
  const imgSrc = pbClient.files.getURL(record, fileName);
  const shortName: string = getShortName(name);

  return (
    <Avatar {...props}>
      <AvatarImage src={imgSrc} alt={name} />
      <AvatarFallback>{shortName}</AvatarFallback>
    </Avatar>
  );
}
