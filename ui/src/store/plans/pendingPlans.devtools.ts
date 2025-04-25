import { pane } from '@/tweakpane';

import { usePendingPlansStore } from './pendingPlans';

const params = {
  get newCharacterPlans() {
    return JSON.stringify(usePendingPlansStore.getState().items, null, 2);
  },
};
const group = pane.addFolder({ title: 'Pending Plans', expanded: false });
group.addBinding(params, 'newCharacterPlans', {
  label: 'Pending plans',
  readonly: true,
  multiline: true,
  rows: 10,
});
group.addButton({ title: 'Clear' }).on('click', () => {
  usePendingPlansStore.setState({ items: [] });
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    group.dispose();
  });
}

export {};
