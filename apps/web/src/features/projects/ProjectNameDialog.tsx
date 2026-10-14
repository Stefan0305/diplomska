import { createProjectInputSchema, type CreateProjectInput } from '@app/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormTextField } from '@/components/FormTextField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { applyServerErrors } from '@/lib/form';

interface ProjectNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialName?: string;
  /** Resolves when saved; a rejection is shown in the dialog. */
  onSubmit: (input: CreateProjectInput) => Promise<unknown>;
}

/** Name form used both to create and to rename a project. */
export function ProjectNameDialog({ open, onOpenChange, ...formProps }: ProjectNameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* DialogContent unmounts when closed, so the form starts fresh on every open. */}
        <ProjectNameForm {...formProps} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

type ProjectNameFormProps = Omit<ProjectNameDialogProps, 'open' | 'onOpenChange'> & {
  onDone: () => void;
};

function ProjectNameForm({
  title,
  description,
  submitLabel,
  initialName = '',
  onSubmit,
  onDone,
}: ProjectNameFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createProjectInputSchema),
    defaultValues: { name: initialName },
  });

  async function handleSubmit(values: CreateProjectInput) {
    setFormError(null);
    try {
      await onSubmit(values);
      onDone();
    } catch (err) {
      setFormError(applyServerErrors(err, form.setError, ['name']));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <FieldGroup className="py-4">
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <FormTextField control={form.control} name="name" label="Project name" />
      </FieldGroup>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
