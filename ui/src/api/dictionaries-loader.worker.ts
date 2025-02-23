import { db, DB_COLLECTION_MAPPING } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';

type ReqCollectionsKeys = keyof typeof DB_COLLECTION_MAPPING;
type ReqCollectionsValue = (typeof DB_COLLECTION_MAPPING)[ReqCollectionsKeys];
const REQ_COLLECTIONS = Array.from(Object.entries(DB_COLLECTION_MAPPING)) as [
  ReqCollectionsKeys,
  ReqCollectionsValue,
][];

export async function loadDictionaries() {
  const version = await pbClient.send('/api/dictionary_version', {});
  const storedVersion = await db.config.get('dictionary_version');
  if (version === storedVersion?.value) {
    console.log('No dictionary update required!');
    postMessage('No dictionary update required');
    return;
  }

  const collections = await Promise.all(
    REQ_COLLECTIONS.map(([, v]) => pbClient.collection(v).getFullList()),
  );

  const collectionIds = collections.map((c) => ({
    id: c[0].collectionId,
    name: c[0].collectionName,
  }));

  await Promise.all([
    ...REQ_COLLECTIONS.map(([c], i) =>
      // @ts-expect-error Don't worry i know what im doing :)
      db[c].bulkPut(collections[i]),
    ),
    db.collectionIds.bulkPut(collectionIds),
  ]);
  db.config.put({ key: 'dictionary_version', value: version });
  postMessage('Data loaded');
}

try {
  loadDictionaries();
} catch (e) {
  console.error(e);
  postMessage('Data loading abort');
}
