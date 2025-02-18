import { useAuth } from '@/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { pbClient } from '@/api/pocketbase';

export function UserInfo() {
  const router = useRouter();
  const navigate = useNavigate();
  const auth = useAuth();

  const handleLogout = async () => {
    auth.logout();
    await router.invalidate();
    navigate({ to: '/login' });
  };

  const user = auth.record;

  if (!user) {
    return null;
  }

  const avatarSrc: string = pbClient.files.getURL(user, user.avatar, {
    thumb: '8x8',
  });
  const shortName: string =
    user.name
      .split(' ')
      .map((p: string) => p[0]?.toUpperCase())
      .join('') ?? '??';

  return (
    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={avatarSrc} alt={user.name} />
        <AvatarFallback className="rounded-lg">{shortName}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{user.name}</span>
        <span className="truncate text-xs">{user.email}</span>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="ms-auto cursor-pointer"
          >
            <Icons.logout />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
