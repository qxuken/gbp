import { type Icon as LucideIcon, AlertCircle, LoaderCircle, LogOut, ChevronsUpDown, Info, ArrowLeft, ArrowRight, Plus, Minus, SquarePen } from 'lucide-react';

export type Icon = typeof LucideIcon;

export const Icons = {
  spinner: LoaderCircle,
  logout: LogOut,
  alert: AlertCircle,
  info: Info,
  dropdown: ChevronsUpDown,
  left: ArrowLeft,
  right: ArrowRight,
  plus: Plus,
  minus: Minus,
  new: SquarePen,
};
