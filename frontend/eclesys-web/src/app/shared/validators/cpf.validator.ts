import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator customizado para CPF brasileiro
 */
export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const cpf = control.value;

    if (!cpf) {
      return null; // Deixa a validação de required cuidar disso
    }

    // Remove formatação
    const cleanCpf = cpf.replace(/[^\d]/g, '');

    // CPF deve ter 11 dígitos
    if (cleanCpf.length !== 11) {
      return { cpfInvalido: true };
    }

    // Rejeita CPFs com todos os dígitos iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return { cpfInvalido: true };
    }

    // Calcula o primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit >= 10) {
      firstDigit = 0;
    }

    // Verifica o primeiro dígito
    if (parseInt(cleanCpf.charAt(9)) !== firstDigit) {
      return { cpfInvalido: true };
    }

    // Calcula o segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    if (secondDigit >= 10) {
      secondDigit = 0;
    }

    // Verifica o segundo dígito
    if (parseInt(cleanCpf.charAt(10)) !== secondDigit) {
      return { cpfInvalido: true };
    }

    return null;
  };
}
