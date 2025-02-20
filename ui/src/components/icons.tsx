import { AlertCircle, LoaderCircle, LogOut, ChevronsUpDown, type Icon as LucideIcon } from 'lucide-react';

export type Icon = typeof LucideIcon;

export const Icons = {
  spinner: LoaderCircle,
  logout: LogOut,
  alert: AlertCircle,
  dropdown: ChevronsUpDown,
};
