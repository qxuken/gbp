import {
  db,
  DB_COLLECTIONS,
  DICTIONARY_VERSION_CONFIG_KEY,
} from '@/api/dictionaries/db';
import { pbClient } from '@/api/pocketbase';

export async function loadDictionaries(reload = false) {
  const version = await pbClient.send('/api/dictionaryVersion', {});
  const storedVersion = await db.config.get(DICTIONARY_VERSION_CONFIG_KEY);
  if (!reload && version === storedVersion?.value) {
    postMessage({ message: 'No dictionary update required' });
    return;
  }

  postMessage({ message: 'Cleared old cache' });

  const collections = await Promise.all(
    DB_COLLECTIONS.map((c) => pbClient.collection(c).getFullList()),
  );
  postMessage({ message: 'Fetched collections' });

  await Promise.all(
    DB_COLLECTIONS.map(async (c, i) => {
      const db_col = db[c];
      await db_col.clear();
      await db_col.bulkPut(collections[i]);
    }),
  );
  postMessage({ message: 'Stored to indexedDB' });

  db.config.put({ key: DICTIONARY_VERSION_CONFIG_KEY, value: version });
  postMessage({ message: 'Data loaded', version });
}

let isLoading = false;
async function loadDictionariesSafe(force = false) {
  if (isLoading) {
    return;
  }
  isLoading = true;
  try {
    await loadDictionaries(force);
  } catch (error) {
    postMessage({
      action: 'notify-error',
      message: 'Genshin database loading error',
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    isLoading = false;
  }
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
