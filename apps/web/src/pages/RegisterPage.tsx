import { PASSWORD_MIN_LENGTH, registerInputSchema, type RegisterInput } from '@app/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
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
import { useRegister } from '@/features/auth/hooks';
import { applyServerErrors } from '@/lib/form';

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(registerInputSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    try {
      await registerMutation.mutateAsync(values);
      navigate('/projects', { replace: true });
    } catch (err) {
      setFormError(applyServerErrors(err, form.setError, ['name', 'email', 'password']));
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Start planning your spaces in 3D.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent>
          <FieldGroup>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <FormTextField control={form.control} name="name" label="Name" autoComplete="name" />
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
              autoComplete="new-password"
              description={`At least ${PASSWORD_MIN_LENGTH} characters.`}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner />}
            Create account
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-foreground underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
