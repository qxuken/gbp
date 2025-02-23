import DictionaryLoaderWorker from './dictionaries-loader.worker?worker';

export const worker = new DictionaryLoaderWorker();

if (import.meta.env.DEV) {
  Promise.all([import('@/tweakpane'), import('./dictionaries-db')]).then(
    ([{ pane }, { db, DICTIONARY_VERSION_CONFIG_KEY }]) => {
      const params = {
        _dictionaryVersion: 'none',
        runningUpdater: false,
        messages: [] as string[],
        messageStr: '',
        async updateField() {
          if (this.runningUpdater) {
            return;
          }
          this.runningUpdater = true;
          const record = await db.config.get(DICTIONARY_VERSION_CONFIG_KEY);
          if (record?.value) {
            this._dictionaryVersion = record?.value;
          }
          this.runningUpdater = false;
        },
        get dictionaryVersion() {
          this.updateField();
          return this._dictionaryVersion;
        },
      };

      worker.addEventListener('message', (e) => {
        console.log('Worker log', e.data);
        params.messages.push(e.data);
        params.messageStr = JSON.stringify(params.messages, null, 2);
      });

      const group = pane.addFolder({ title: 'DB', expanded: false });
      group.addBinding(params, 'dictionaryVersion', {
        label: 'Version',
        readonly: true,
      });
      group.addBinding(params, 'messageStr', {
        label: 'Worker logs',
        multiline: true,
        rows: 10,
        readonly: true,
      });
      group.addButton({ title: 'Load dictionaries' }).on('click', () => {
        worker.postMessage({ action: 'loadDictionaries' });
      });
      group.addButton({ title: 'Reload dictionaries' }).on('click', () => {
        worker.postMessage({ action: 'reloadDictionaries' });
      });
      group.addButton({ title: 'Delete database' }).on('click', () => {
        db.delete();
      });
    },
  );
}
