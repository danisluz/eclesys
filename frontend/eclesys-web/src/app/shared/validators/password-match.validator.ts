import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const newPasswordControl = control.get('newPassword');
  const confirmPasswordControl = control.get('confirmPassword');

  const newPasswordValue = newPasswordControl?.value ?? '';
  const confirmPasswordValue = confirmPasswordControl?.value ?? '';

  // Se ainda não tem valor suficiente, limpa mismatch (não polui UI)
  if (!newPasswordValue || !confirmPasswordValue) {
    clearMismatchError(confirmPasswordControl);
    return null;
  }

  const isMatch = newPasswordValue === confirmPasswordValue;

  if (isMatch) {
    clearMismatchError(confirmPasswordControl);
    return null;
  }

  // seta erro no control (para o mat-error responder)
  setMismatchError(confirmPasswordControl);
  return { passwordMismatch: true };
}

function setMismatchError(
  confirmPasswordControl: AbstractControl | null,
): void {
  if (!confirmPasswordControl) return;

  const currentErrors = confirmPasswordControl.errors ?? {};
  if (currentErrors['passwordMismatch']) return;

  confirmPasswordControl.setErrors({
    ...currentErrors,
    passwordMismatch: true,
  });
}

function clearMismatchError(
  confirmPasswordControl: AbstractControl | null,
): void {
  if (!confirmPasswordControl?.errors) return;

  const { passwordMismatch, ...remainingErrors } =
    confirmPasswordControl.errors;

  // se só tinha mismatch, limpa tudo
  if (Object.keys(remainingErrors).length === 0) {
    confirmPasswordControl.setErrors(null);
    return;
  }

  // mantém outros erros (minlength, required, etc)
  confirmPasswordControl.setErrors(remainingErrors);
}
