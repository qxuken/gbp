import { Link } from '@tanstack/react-router';

import { pbClient } from '@/api/pocketbase';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { getShortName } from '@/lib/get-short-name';
import { useUser } from '@/store/auth';

export function UserManagement() {
  const user = useUser();

  if (!user) {
    return null;
  }

  const avatarUrl = pbClient.files.getURL(user, user.avatar);
  const shortName = getShortName(user.name);

  return (
    <DropdownMenu>
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
        <DropdownMenuItem asChild>
          <Link
            to="/builds/user/profile"
            search={(s) => s}
            className="flex items-center gap-2"
          >
            <Icons.Profile className="size-4" />
            Edit Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/builds/user/email"
            search={(s) => s}
            className="flex items-center gap-2"
          >
            <Icons.Email className="size-4" />
            Change Email
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/builds/user/password"
            search={(s) => s}
            className="flex items-center gap-2"
          >
            <Icons.Password className="size-4" />
            Change Password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/builds/user/logout"
            search={(s) => s}
            className="flex items-center gap-2"
          >
            <Icons.Logout className="size-4" />
            Log out
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/builds/user/delete"
            search={(s) => s}
            className="flex items-center gap-2 text-destructive"
          >
            <Icons.Remove className="size-4" />
            Delete Account
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
