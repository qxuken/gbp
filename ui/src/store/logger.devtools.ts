import { pane } from '@/tweakpane';

import { LEVELS, logger, LogLevel } from './logger';

const OPTIONS = Object.fromEntries(
  Object.keys(LEVELS).map((level) => [level, level]),
);

const group = pane.addFolder({ title: 'Logger', expanded: false });
const params = {
  get level() {
    return logger.level();
  },
  set level(level: LogLevel) {
    logger.enable(level);
  },
};
group.addBinding(params, 'level', { label: 'Level', options: OPTIONS });

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    group.dispose();
  });
}

export {};
