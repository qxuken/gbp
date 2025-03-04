import { useLiveQuery } from 'dexie-react-hooks';

import {
  db,
  DB_COLLECTION_MAPPING,
  DBCollections,
} from '@/api/dictionaries-db';
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
  collectionName: DBCollections;
  recordId: string;
  fileName: string;
  name: string;
  size?: number;
};

export function CollectionAvatar({
  collectionName,
  recordId,
  fileName,
  name,
  size = 9,
  ...props
}: Props) {
  const collection = useLiveQuery(
    () => db.collectionIds.get(DB_COLLECTION_MAPPING[collectionName]),
    [collectionName],
  );
  const imgSrc = pbClient.files.getURL(
    { collectionId: collection?.id ?? '', id: recordId },
    fileName,
    { thumb: `${size}x${size}` },
  );
  const shortName: string = getShortName(name);
  return (
    <Avatar {...props}>
      <AvatarImage src={imgSrc} alt={name} />
      <AvatarFallback>{shortName}</AvatarFallback>
    </Avatar>
  );
}
