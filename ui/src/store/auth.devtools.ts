import { pbClient } from '@/api/pocketbase';
import { pane } from '@/tweakpane';

import { isAuthenticatedAtom, recordAtom } from './auth';
import { store } from './jotai-store';

const group = pane.addFolder({ title: 'Auth', expanded: false });
const params = {
  get ['store:userId']() {
    return store.get(recordAtom)?.id ?? 'none';
  },
  get ['pbClient:userId']() {
    return pbClient.authStore.record?.id ?? 'none';
  },
  get ['store:isAuthenticated']() {
    return store.get(isAuthenticatedAtom);
  },
  get ['pbClient:isValid']() {
    return pbClient.authStore.isValid;
  },
  get ['pbClient:isSuperuser']() {
    return pbClient.authStore.isSuperuser;
  },
};
group.addBinding(params, 'store:userId', { readonly: true });
group.addBinding(params, 'pbClient:userId', { readonly: true });
group.addBinding(params, 'store:isAuthenticated', { readonly: true });
group.addBinding(params, 'pbClient:isValid', { readonly: true });
group.addBinding(params, 'pbClient:isSuperuser', { readonly: true });
group
  .addButton({ title: 'pb logout' })
  .on('click', () => pbClient.authStore.clear());

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    group.dispose();
  });
}

export {};
