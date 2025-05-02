interface Window {
  pbClient: import('pocketbase');
  loadDevtools(): void;
  enableLogs(): void;
  disableLogs(): void;
  setLogLevel(level: import('@/store/logger').LogLevel): void;
  logger: import('@/store/logger').Logger;
}
