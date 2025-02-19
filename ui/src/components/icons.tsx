import { AlertCircle, LoaderCircle, LogOut, type Icon as LucideIcon } from 'lucide-react';

export type Icon = typeof LucideIcon;

export const Icons = {
  spinner: LoaderCircle,
  logout: LogOut,
  alert: AlertCircle,
};
