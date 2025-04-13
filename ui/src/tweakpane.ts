import { Pane } from 'tweakpane';

document.createElement('div');
const container = document.createElement('div');
container.className = 'fixed right-20 bottom-4';
document.body.appendChild(container);

const styleElement = document.createElement('style');
styleElement.textContent = `
:root {
  --tp-base-background-color: hsla(230, 5%, 90%, 1.00);
  --tp-base-shadow-color: hsla(0, 0%, 0%, 0.10);
  --tp-button-background-color: hsla(230, 7%, 75%, 1.00);
  --tp-button-background-color-active: hsla(230, 7%, 60%, 1.00);
  --tp-button-background-color-focus: hsla(230, 7%, 65%, 1.00);
  --tp-button-background-color-hover: hsla(230, 7%, 70%, 1.00);
  --tp-button-foreground-color: hsla(230, 10%, 30%, 1.00);
  --tp-container-background-color: hsla(230, 15%, 30%, 0.20);
  --tp-container-background-color-active: hsla(230, 15%, 30%, 0.32);
  --tp-container-background-color-focus: hsla(230, 15%, 30%, 0.28);
  --tp-container-background-color-hover: hsla(230, 15%, 30%, 0.24);
  --tp-container-foreground-color: hsla(230, 10%, 30%, 1.00);
  --tp-groove-foreground-color: hsla(230, 15%, 30%, 0.10);
  --tp-input-background-color: hsla(230, 15%, 30%, 0.10);
  --tp-input-background-color-active: hsla(230, 15%, 30%, 0.22);
  --tp-input-background-color-focus: hsla(230, 15%, 30%, 0.18);
  --tp-input-background-color-hover: hsla(230, 15%, 30%, 0.14);
  --tp-input-foreground-color: hsla(230, 10%, 30%, 1.00);
  --tp-label-foreground-color: hsla(230, 10%, 30%, 0.70);
  --tp-monitor-background-color: hsla(230, 15%, 30%, 0.10);
  --tp-monitor-foreground-color: hsla(230, 10%, 30%, 0.50);
}
.dark {
  --tp-base-background-color: hsla(230, 20%, 11%, 1.00);
  --tp-base-shadow-color: hsla(0, 0%, 0%, 0.2);
  --tp-button-background-color: hsla(230, 10%, 80%, 1.00);
  --tp-button-background-color-active: hsla(230, 10%, 95%, 1.00);
  --tp-button-background-color-focus: hsla(230, 10%, 90%, 1.00);
  --tp-button-background-color-hover: hsla(230, 10%, 85%, 1.00);
  --tp-button-foreground-color: hsla(230, 20%, 11%, 1.00);
  --tp-container-background-color: hsla(230, 25%, 16%, 1.00);
  --tp-container-background-color-active: hsla(230, 25%, 31%, 1.00);
  --tp-container-background-color-focus: hsla(230, 25%, 26%, 1.00);
  --tp-container-background-color-hover: hsla(230, 25%, 21%, 1.00);
  --tp-container-foreground-color: hsla(230, 10%, 80%, 1.00);
  --tp-groove-foreground-color: hsla(230, 20%, 8%, 1.00);
  --tp-input-background-color: hsla(230, 20%, 8%, 1.00);
  --tp-input-background-color-active: hsla(230, 28%, 23%, 1.00);
  --tp-input-background-color-focus: hsla(230, 28%, 18%, 1.00);
  --tp-input-background-color-hover: hsla(230, 20%, 13%, 1.00);
  --tp-input-foreground-color: hsla(230, 10%, 80%, 1.00);
  --tp-label-foreground-color: hsla(230, 12%, 48%, 1.00);
  --tp-monitor-background-color: hsla(230, 20%, 8%, 1.00);
  --tp-monitor-foreground-color: hsla(230, 12%, 48%, 1.00);
}
`;
document.head.appendChild(styleElement);

export const pane = new Pane({
  container,
  title: 'Dev panel',
  expanded: false,
});
