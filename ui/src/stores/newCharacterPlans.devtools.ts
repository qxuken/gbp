import { pane } from '@/tweakpane';

import { newCharacterPlans } from './newCharacterPlans';

const params = {
  get latestId() {
    return newCharacterPlans.getState().latestId;
  },
  get newCharacterPlans() {
    return JSON.stringify(newCharacterPlans.getState().characterPlans, null, 2);
  },
};
const group = pane.addFolder({ title: 'New Character Plans', expanded: false });
group.addBinding(params, 'newCharacterPlans', {
  label: 'Pending plans',
  readonly: true,
  multiline: true,
  rows: 10,
});
group.addBinding(params, 'latestId', {
  label: 'Latest Id',
  readonly: true,
});
group.addButton({ title: 'Clear' }).on('click', () => {
  newCharacterPlans.setState({ latestId: 0, characterPlans: [] });
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    group.dispose();
  });
}

export {};
