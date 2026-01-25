package com.eclesys.api.features.members.dto;

public record AddressDto(
    String street,        // Rua/Logradouro
    String number,        // Número
    String complement,    // Complemento
    String neighborhood,  // Bairro
    String city,          // Cidade
    String state,         // Estado (UF)
    String zipCode        // CEP
) {}
