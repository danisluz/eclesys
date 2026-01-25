package com.eclesys.api.util;

/**
 * Utilitário para validação de CPF
 */
public class CpfValidator {

  /**
   * Valida se um CPF é válido
   * @param cpf CPF com ou sem formatação (000.000.000-00 ou 00000000000)
   * @return true se o CPF for válido, false caso contrário
   */
  public static boolean isValid(String cpf) {
    if (cpf == null || cpf.trim().isEmpty()) {
      return false;
    }

    // Remove formatação (pontos, hífens, espaços)
    cpf = cpf.replaceAll("[^0-9]", "");

    // CPF deve ter exatamente 11 dígitos
    if (cpf.length() != 11) {
      return false;
    }

    // Rejeita CPFs com todos os dígitos iguais (000.000.000-00, 111.111.111-11, etc)
    if (cpf.matches("(\\d)\\1{10}")) {
      return false;
    }

    try {
      // Calcula o primeiro dígito verificador
      int sum = 0;
      for (int i = 0; i < 9; i++) {
        sum += Character.getNumericValue(cpf.charAt(i)) * (10 - i);
      }
      int firstDigit = 11 - (sum % 11);
      if (firstDigit >= 10) {
        firstDigit = 0;
      }

      // Verifica o primeiro dígito
      if (Character.getNumericValue(cpf.charAt(9)) != firstDigit) {
        return false;
      }

      // Calcula o segundo dígito verificador
      sum = 0;
      for (int i = 0; i < 10; i++) {
        sum += Character.getNumericValue(cpf.charAt(i)) * (11 - i);
      }
      int secondDigit = 11 - (sum % 11);
      if (secondDigit >= 10) {
        secondDigit = 0;
      }

      // Verifica o segundo dígito
      return Character.getNumericValue(cpf.charAt(10)) == secondDigit;

    } catch (Exception e) {
      return false;
    }
  }

  /**
   * Remove a formatação do CPF, mantendo apenas os números
   */
  public static String cleanCpf(String cpf) {
    if (cpf == null) {
      return null;
    }
    return cpf.replaceAll("[^0-9]", "");
  }
}
