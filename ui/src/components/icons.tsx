import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronsUpDown,
  Info,
  LoaderCircle,
  LogOut,
  type Icon as LucideIcon,
  Minus,
  Plus,
  SquarePen,
} from 'lucide-react';

export type Icon = typeof LucideIcon;

export const Icons = {
  alert: AlertCircle,
  dropdown: ChevronsUpDown,
  info: Info,
  left: ArrowLeft,
  logout: LogOut,
  minus: Minus,
  new: SquarePen,
  plus: Plus,
  right: ArrowRight,
  spinner: LoaderCircle,
};
