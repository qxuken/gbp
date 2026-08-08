import { produce } from 'immer';
import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';

export enum UiPlansMode {
  Full = 'full',
  Short = 'short',
  V2 = 'v2',
}

const UIPlansModes = [
  UiPlansMode.Full,
  UiPlansMode.Short,
  UiPlansMode.V2,
] as const;

export function isUiPlansMode(value: string): value is UiPlansMode {
  return UIPlansModes.includes(value as UiPlansMode);
}

export interface UiPlansConfig {
  mode: UiPlansMode;
  setMode(mode: UiPlansMode): void;
}

const useUiPlansConfig = create(
  subscribeWithSelector(
    persist<UiPlansConfig>(
      (set, get) => ({
        mode: get()?.mode ?? UiPlansMode.V2,
        setMode(mode) {
          set(
            produce((state) => {
              state.mode = mode;
            }),
          );
        },
      }),
      {
        name: 'gbp__ui_plans_config',
      },
    ),
  ),
);

export function useUiPlansConfigMode() {
  const value = useUiPlansConfig((s) => s.mode);
  const setValue = useUiPlansConfig((s) => s.setMode);
  return [value, setValue] as const;
}

export function useUiPlansConfigModeValue() {
  return useUiPlansConfig((s) => s.mode);
}
