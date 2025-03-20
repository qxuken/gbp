import { useState } from 'react';

import { pbClient } from '@/api/pocketbase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getShortName } from '@/lib/utils';
import { auth as useAuth } from '@/stores/auth';

import { DeleteAccountDialog } from './delete-account-dialog';
import { EmailEditDialog } from './email-edit-dialog';
import { LogoutDialog } from './logout-dialog';
import { PasswordEditDialog } from './password-edit-dialog';
import { ProfileEditDialog } from './profile-edit-dialog';

export function UserManagement() {
  const user = useAuth((s) => s.record);
  const [open, setOpen] = useState(false);

  if (!user) {
    return null;
  }

  const avatarUrl = pbClient.files.getURL(user, user.avatar);
  const shortName = getShortName(user.name);

  const closeDropdown = () => setOpen(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={user.name} />
            <AvatarFallback>{shortName}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ProfileEditDialog onSuccess={closeDropdown} />
        <EmailEditDialog onSuccess={closeDropdown} />
        <PasswordEditDialog onSuccess={closeDropdown} />
        <DropdownMenuSeparator />
        <LogoutDialog onLogout={closeDropdown} />
        <DropdownMenuSeparator />
        <DeleteAccountDialog onDelete={closeDropdown} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
