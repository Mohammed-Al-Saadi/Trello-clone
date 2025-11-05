// src/app/utils/form-errors.ts
import { FormGroup } from '@angular/forms';

/**
 * Generate readable error messages for form controls.
 */
export const getErrorMessages = (form: FormGroup, controlName: string, label: string): string[] => {
  const control = form.get(controlName);
  if (!control) return [];

  const errors = control.errors ?? {};
  const messages: string[] = [];

  if (errors['required']) messages.push(`${label} is required.`);
  if (errors['email']) messages.push(`Please enter a valid email.`);
  if (errors['minlength'])
    messages.push(`${label} must be at least ${errors['minlength'].requiredLength} characters.`);
  if (errors['maxlength'])
    messages.push(`${label} must be at most ${errors['maxlength'].requiredLength} characters.`);
  if (errors['pattern']) messages.push(`${label} has an invalid format.`);

  if (controlName === 'confirmPassword' && form.hasError('passwordMismatch')) {
    messages.push(`Passwords do not match.`);
  }

  return messages;
};
