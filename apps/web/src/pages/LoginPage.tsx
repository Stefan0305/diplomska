import { loginInputSchema, type LoginInput } from '@app/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { FormTextField } from '@/components/FormTextField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useLogin } from '@/features/auth/hooks';
import type { RedirectState } from '@/features/auth/routes';
import { applyServerErrors } from '@/lib/form';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as RedirectState | null)?.from ?? '/projects';
  const loginMutation = useLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      await loginMutation.mutateAsync(values);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(applyServerErrors(err, form.setError, ['email', 'password']));
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Welcome back. Log in to open your projects.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent>
          <FieldGroup>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <FormTextField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
            />
            <FormTextField
              control={form.control}
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner />}
            Log in
          </Button>
          <p className="text-sm text-muted-foreground">
            No account yet?{' '}
            <Link to="/register" className="text-foreground underline underline-offset-4">
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
