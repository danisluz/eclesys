import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CepLookupResult, ViaCepResponse } from '../models/cep-lookup.models';
import { catchError, map, of, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CepLookupService {
  httpClient = inject(HttpClient);

  cacheByCep = new Map<string, CepLookupResult | null>();

  normalizeCep(rawCep: string): string {
    return (rawCep ?? '').replace(/\D/g, '').slice(0, 8);
  }

  isValidCep(rawCep: string): boolean {
    return this.normalizeCep(rawCep).length === 8;
  }

  lookup(rawCep: string) {
    const cep = this.normalizeCep(rawCep);

    if (cep.length !== 8) {
      return of(null);
    }

    if (this.cacheByCep.has(cep)) {
      return of(this.cacheByCep.get(cep) ?? null);
    }

    const url = `${environment.addressLookup.viaCepBaseUrl}/${cep}/json/`;

    return this.httpClient.get<ViaCepResponse>(url).pipe(
      map((response) => {
        if (!response || response.erro) {
          this.cacheByCep.set(cep, null);
          return null;
        }

        const result: CepLookupResult = {
          street: response.logradouro ?? '',
          neighborhood: response.bairro ?? '',
          city: response.localidade ?? '',
          state: response.uf ?? '',
        };

        this.cacheByCep.set(cep, result);
        return result;
      }),
      catchError(() => {
        this.cacheByCep.set(cep, null);
        return of(null);
      }),
      shareReplay(1),
    );
  }
}
