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
  SquareSplitVertical,
  Slash,
  GripHorizontal,
} from 'lucide-react';

export type Icon = typeof LucideIcon;

export const Icons = {
  Spinner: LoaderCircle,
  Dropdown: ChevronsUpDown,
  Close: CircleX,
  Alert: AlertCircle,
  Info: Info,
  Left: ArrowLeft,
  Right: ArrowRight,
  Logout: LogOut,
  Minus: Minus,
  Plus: Plus,
  Add: Plus,
  Remove: Trash,
  New: SquarePen,
  SplitY: SquareSplitVertical,
  Divide: Slash,
  Drag: GripHorizontal,
};
