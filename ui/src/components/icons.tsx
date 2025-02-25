import {
  type Icon as LucideIcon,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronsUpDown,
  Info,
  LoaderCircle,
  LogOut,
  Minus,
  Plus,
  SquarePen,
  CircleX,
  Trash,
} from 'lucide-react';

export type Icon = typeof LucideIcon;

export const Icons = {
  spinner: LoaderCircle,
  dropdown: ChevronsUpDown,
  close: CircleX,
  alert: AlertCircle,
  info: Info,
  left: ArrowLeft,
  right: ArrowRight,
  logout: LogOut,
  minus: Minus,
  plus: Plus,
  add: Plus,
  remove: Trash,
  new: SquarePen,
};
