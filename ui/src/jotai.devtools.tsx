import { DevTools } from 'jotai-devtools';
import 'jotai-devtools/styles.css';
import { useAtomValue } from 'jotai/react';
import ReactDOM from 'react-dom/client';

import { store } from '@/stores/jotai-store';
import { displayThemeAtom } from '@/stores/theme';

function JotaiDevTools() {
  const theme = useAtomValue(displayThemeAtom);
  return (
    <>
      <DevTools position="bottom-right" theme={theme} store={store} />
    </>
  );
}

let rootElement = document.getElementById('jotai-devtools')!;
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'jotai-devtools';
  document.body.appendChild(rootElement);
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<JotaiDevTools />);
}
