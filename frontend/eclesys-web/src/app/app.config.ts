import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideEnvironmentNgxMask } from 'ngx-mask';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { BRAZIL_DATE_FORMATS, BrazilDateAdapter } from './shared/date/brazil-date-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: DateAdapter, useClass: BrazilDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: BRAZIL_DATE_FORMATS },
    importProvidersFrom(MatSnackBarModule),
    provideEnvironmentNgxMask(),
  ],
};
