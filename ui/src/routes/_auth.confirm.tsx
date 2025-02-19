import { createFileRoute, Link, redirect, useNavigate, useRouter } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth';
import { toast } from 'sonner';
import { useTimeoutButton } from '@/hooks/useTimeoutButton';
import { Icons } from '@/components/icons';

const fallback = '/' as const;

export const Route = createFileRoute('/_auth/confirm')({
  validateSearch: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  component: ConfirmComponent,
});

function ConfirmComponent() {
  const auth = useAuth()
  const router = useRouter();
  const navigate = useNavigate();
  const search = Route.useSearch()
  const [resendTimeout, startResendTimeout] = useTimeoutButton(60, true)

  const login = async () => {
    try {
      await auth.login(search.email, search.password);
      await router.invalidate();
      await navigate({ to: search.redirect || fallback });
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message);
      }
    }
  }

  const resendEmail = async () => {
    try {
      await auth.requestVerification(search.email);
      startResendTimeout()
      toast.success('Check your inbox');
    } catch {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-center">
              Verify your email to activate your account
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-2'>
            <Alert>
              <Icons.alert className='size-4' />
              <AlertDescription>
                We’ve sent a verification email. Please check your inbox and confirm your email to proceed.
              </AlertDescription>
            </Alert>
            <Button size="lg" className='mt-2 w-full' onClick={login}>I’ve Verified My Email</Button>
            <Button variant="outline" size="lg" className='w-full' onClick={resendEmail} disabled={resendTimeout > 0}>
              Resend Verification Email{resendTimeout > 0 && ` - ${resendTimeout}`}
            </Button>
            <div className="mt-2 text-center text-sm">
              Have verified account?{' '}
              <Link
                to="/login"
                className="underline underline-offset-4"
                search={() => ({ redirect: search.redirect })}
                activeOptions={{ exact: true }}
              >
                Login
              </Link>{' '}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
