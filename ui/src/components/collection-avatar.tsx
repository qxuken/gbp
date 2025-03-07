import { RecordModel } from 'pocketbase';

import { pbClient } from '@/api/pocketbase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function getShortName(name?: string) {
  return (
    name
      ?.split(' ')
      .map((p: string) => p[0]?.toUpperCase())
      .join('') ?? '??'
  );
}

type Props = Parameters<typeof Avatar>[0] & {
  record: RecordModel;
  fileName: string;
  name: string;
  size?: number;
};

export function CollectionAvatar({
  record,
  fileName,
  name,
  size = 9,
  ...props
}: Props) {
  const imgSrc = pbClient.files.getURL(record, fileName, {
    thumb: `${size}x${size}`,
  });
  const shortName: string = getShortName(name);

  return (
    <Avatar {...props}>
      <AvatarImage src={imgSrc} alt={name} />
      <AvatarFallback>{shortName}</AvatarFallback>
    </Avatar>
  );
}
