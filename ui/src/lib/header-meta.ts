export function updateHeaderMeta(key: string, value: string) {
  let element = document.head.querySelector(`meta[name="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}
