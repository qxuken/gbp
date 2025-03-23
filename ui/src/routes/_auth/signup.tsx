import { zodResolver } from '@hookform/resolvers/zod';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ClientResponseError } from 'pocketbase';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Icons } from '@/components/icons';
import { AvatarInput } from '@/components/ui/avatar-input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { auth as useAuth } from '@/stores/auth';

export const Route = createFileRoute('/_auth/signup')({
  component: SignupComponent,
});

const serverValueErrorSchema = z.object({
  message: z.string(),
});

const formSchema = z
  .object({
    avatar: z.instanceof(FileList).optional(),
    email: z.string().email({
      message: 'Please enter a valid email address.',
    }),
    name: z.string().min(2, {
      message: 'Name must be at least 2 characters.',
    }),
    password: z.string().min(8, {
      message: 'Password must be at least 8 characters.',
    }),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

function SignupComponent() {
  const register = useAuth((s) => s.register);
  const requestVerification = useAuth((s) => s.requestVerification);
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('email', values.email);
      formData.append('password', values.password);
      formData.append('passwordConfirm', values.passwordConfirm);
      if (values.avatar?.[0]) {
        formData.append('avatar', values.avatar[0]);
      }

      await register(formData);
      await requestVerification(values.email);

      await navigate({
        search: { ...search, email: values.email, password: values.password },
        to: '/confirm',
      });
    } catch (e) {
      if (e instanceof ClientResponseError) {
        toast.error(e.message);
        if (typeof e.response.data == 'object') {
          for (const [key, value] of Object.entries(e.response.data)) {
            const parsed = serverValueErrorSchema.safeParse(value);
            if (parsed.success) {
              form.setError(key as keyof z.infer<typeof formSchema>, {
                message: parsed.data.message,
              });
            }
          }
        }
      } else {
        toast.error('Something went wrong');
      }
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Create an Account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your details to sign up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <AvatarInput
                      field={field}
                      name={form.watch('name') || 'John Doe'}
                      className="h-24 w-24"
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="me@example.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="underline underline-offset-4"
                    search={(prev) => prev}
                    activeOptions={{ exact: true }}
                  >
                    Login
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
