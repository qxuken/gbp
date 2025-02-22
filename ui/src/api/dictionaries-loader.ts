import DictionaryLoaderWorker from './dictionaries-loader.worker?worker';

export const worker = new DictionaryLoaderWorker();

worker.addEventListener('message', (e) => {
  console.log('DictionaryLoaderWorker', e);
});
