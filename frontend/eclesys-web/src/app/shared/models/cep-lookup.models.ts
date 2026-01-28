export type CepLookupResult = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};
