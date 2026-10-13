import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';

/**
 * Show a failed request's errors on the form: per-field messages from the server go under
 * their inputs; anything else becomes a form-level message (returned for an alert).
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldNames: readonly FieldPath<T>[],
): string | null {
  if (!(error instanceof ApiError)) return 'Something went wrong. Is the API running?';

  let shownOnField = false;
  for (const [field, message] of Object.entries(error.fields ?? {})) {
    if ((fieldNames as readonly string[]).includes(field)) {
      setError(field as FieldPath<T>, { type: 'server', message });
      shownOnField = true;
    }
  }
  return shownOnField ? null : error.message;
}
