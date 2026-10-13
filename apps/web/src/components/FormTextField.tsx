import type { ComponentProps } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface FormTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  type?: ComponentProps<'input'>['type'];
  autoComplete?: string;
}

/** A labelled text input bound to react-hook-form, showing its validation error underneath. */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  type = 'text',
  autoComplete,
}: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            {...field}
            value={field.value ?? ''}
            id={name}
            type={type}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
          />
          {description && !fieldState.invalid && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
