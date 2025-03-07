import {
  db,
  DB_COLLECTION_MAPPING,
  DICTIONARY_VERSION_CONFIG_KEY,
  type DBCollections,
  type PBCollections,
} from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';

const REQ_COLLECTIONS = Array.from(Object.entries(DB_COLLECTION_MAPPING)) as [
  DBCollections,
  PBCollections,
][];

export async function loadDictionaries(force = false) {
  const version = await pbClient.send('/api/dictionaryVersion', {});
  const storedVersion = await db.config.get(DICTIONARY_VERSION_CONFIG_KEY);
  if (!force && version === storedVersion?.value) {
    postMessage({ message: 'No dictionary update required' });
    return;
  }

  postMessage({ message: 'Fetching collections' });
  const collections = await Promise.all(
    REQ_COLLECTIONS.map(([, v]) => pbClient.collection(v).getFullList()),
  );
  postMessage({ message: 'Fetched collections' });

  const collectionIds = collections.map((c) => ({
    id: c[0].collectionId,
    name: c[0].collectionName,
  }));

  postMessage({ message: 'Storing to indexedDB' });
  await Promise.all([
    ...REQ_COLLECTIONS.map(([c], i) =>
      // @ts-expect-error Don't worry i know what im doing :)
      db[c].bulkPut(collections[i]),
    ),
    db.collectionIds.bulkPut(collectionIds),
  ]);
  postMessage({ message: 'Stored to indexedDB' });

  db.config.put({ key: DICTIONARY_VERSION_CONFIG_KEY, value: version });
  postMessage({ message: 'Data loaded', version });
}

let isLoading = false;
function loadDictionariesSafe(force = false) {
  if (isLoading) {
    return;
  }
  isLoading = true;
  loadDictionaries(force)
    .catch((error) => {
      postMessage({ message: 'Data loading error', error: error.message });
    })
    .finally(() => {
      isLoading = false;
    });
}

loadDictionariesSafe();

self.addEventListener('message', (e) => {
  switch (e.data?.action) {
    case 'loadDictionaries':
      loadDictionariesSafe();
      break;
    case 'reloadDictionaries':
      loadDictionariesSafe(true);
      break;
  }
});
