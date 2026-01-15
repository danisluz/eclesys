import { Routes } from '@angular/router';
import { PublicShellComponent } from './core/layout/public-shell/public-shell.component';
import { LandingComponent } from './features/public/landing-component/landing.component';
import { authGuard } from './core/auth/auth.guard';
import { DashboardComponent } from './features/app/dashboard-component/dashboard.component';
import { PricingComponent } from './features/public/pricing-component/pricing.component';
import { SignupComponent } from './features/public/signup-component/signup.component';
import { LoginComponent } from './features/public/login-component/login.component';
import { AppShellComponent } from './core/layout/app-shell/app-shell.component';
import { ProfileComponent } from './features/app/profile-component/profile.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicShellComponent,
    children: [
      { path: '', component: LandingComponent },
      { path: 'pricing', component: PricingComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'login', component: LoginComponent },
    ],
  },
  {
    path: 'app',
    component: AppShellComponent,
    // canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },

    ],
  },
  { path: '**', redirectTo: '' },
];
