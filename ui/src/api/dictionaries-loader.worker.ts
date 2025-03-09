import {
  db,
  DB_COLLECTIONS,
  DICTIONARY_VERSION_CONFIG_KEY,
} from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';

const CACHE_NAME = 'dict-images-v1';

export async function loadDictionaries(reload = false) {
  const version = await pbClient.send('/api/dictionaryVersion', {});
  const storedVersion = await db.config.get(DICTIONARY_VERSION_CONFIG_KEY);
  if (!reload && version === storedVersion?.value) {
    postMessage({ message: 'No dictionary update required' });
    return;
  }

  await caches.delete(CACHE_NAME);
  postMessage({ message: 'Cleared old cache' });

  const collections = await Promise.all(
    DB_COLLECTIONS.map((c) => pbClient.collection(c).getFullList()),
  );
  postMessage({ message: 'Fetched collections' });

  await Promise.all(
    DB_COLLECTIONS.map((c, i) => db[c].bulkPut(collections[i])),
  );
  postMessage({ message: 'Stored to indexedDB' });

  db.config.put({ key: DICTIONARY_VERSION_CONFIG_KEY, value: version });
  postMessage({ message: 'Data loaded', version });

  const cache = await caches.open(CACHE_NAME);
  collections_loop: for (const collection of collections) {
    for (const item of collection) {
      if (!('icon' in item) || typeof item.icon !== 'string') {
        continue collections_loop;
      }
      const fileUrl = pbClient.files.getURL(item, item.icon);
      cache.add(fileUrl);
    }
  }
  postMessage({ message: 'Cache setup success' });
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

// NOTE: Check on https
self.addEventListener('fetch', (event) => {
  console.log('fetch event:unverified');
  if (!(event instanceof FetchEvent)) {
    return;
  }
  console.log('fetch event:verified');
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      console.log('fetch event:cached', cachedResponse);
      return cachedResponse ?? fetch(event.request);
    }),
  );
});
