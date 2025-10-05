import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEBUG_ENABLED } from '@/config';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'off';
export const LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  off: 5,
} satisfies Record<LogLevel, number>;

type LoggerState = {
  level: LogLevel;
  setLevel(level: LogLevel): void;
};

export const useLoggerStore = create(
  persist<LoggerState>(
    (set, get) => ({
      level: get()?.level ?? (DEBUG_ENABLED ? 'trace' : 'off'),
      setLevel: (level) => set({ level }),
    }),
    {
      name: 'gbp__logger',
    },
  ),
);

const shouldLog = (messageLevel: LogLevel, currentLevel: LogLevel) =>
  LEVELS[messageLevel] >= LEVELS[currentLevel];

export const logger = {
  trace(...args: unknown[]) {
    if (shouldLog('trace', this.level)) console.trace(...args);
  },
  debug(...args: unknown[]) {
    if (shouldLog('debug', this.level)) console.debug(...args);
  },
  info(...args: unknown[]) {
    if (shouldLog('info', this.level)) console.info(...args);
  },
  warn(...args: unknown[]) {
    if (shouldLog('warn', this.level)) console.warn(...args);
  },
  error(...args: unknown[]) {
    if (shouldLog('error', this.level)) console.error(...args);
  },
  get level() {
    return useLoggerStore.getState().level;
  },
  enable(level: LogLevel = 'debug') {
    useLoggerStore.getState().setLevel(level);
  },
  disable() {
    useLoggerStore.getState().setLevel('off');
  },
} as const;

export type Logger = typeof logger;

export function useLogger() {
  const level = useLoggerStore((state) => state.level);
  const setLevel = useLoggerStore((state) => state.setLevel);
  return { level, setLevel, logger };
}

if (typeof window !== 'undefined') {
  window.enableLogs = logger.enable;
  window.disableLogs = logger.disable;
  window.setLogLevel = logger.enable;
  window.logger = logger;
}
