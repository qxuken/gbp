import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      level: get()?.level ?? (import.meta.env.DEV ? 'trace' : 'off'),
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
  trace: (...args: unknown[]) => {
    const { level } = useLoggerStore.getState();
    if (shouldLog('trace', level)) console.trace(...args);
  },
  debug: (...args: unknown[]) => {
    const { level } = useLoggerStore.getState();
    if (shouldLog('debug', level)) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    const { level } = useLoggerStore.getState();
    if (shouldLog('info', level)) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    const { level } = useLoggerStore.getState();
    if (shouldLog('warn', level)) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    const { level } = useLoggerStore.getState();
    if (shouldLog('error', level)) console.error(...args);
  },
  level: () => useLoggerStore.getState().level,
  enable: (level: LogLevel = 'debug') =>
    useLoggerStore.getState().setLevel(level),
  disable: () => useLoggerStore.getState().setLevel('off'),
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
