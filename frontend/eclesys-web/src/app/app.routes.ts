import { Routes } from '@angular/router';
import { PublicShellComponent } from './core/layout/public-shell/public-shell.component';
import { LandingComponent } from './features/public/landing/pages/landing/landing.component';
import { authGuard } from './core/auth/auth.guard';
import { DashboardComponent } from './features/app/dashboard/pages/dashboard/dashboard.component';
import { PricingComponent } from './features/public/pricing/pages/pricing/pricing.component';
import { SignupComponent } from './features/public/signup/pages/signup/signup.component';
import { LoginComponent } from './features/public/login/pages/login/login.component';
import { AppShellComponent } from './core/layout/app-shell/app-shell.component';
import { ProfileComponent } from './features/app/profile/pages/profile/profile.component';
import { OrganizationsComponent } from './features/app/organizations/pages/organizations/organizations.component';
import { ChurchRolesComponent } from './features/app/church-roles/pages/church-roles/church-roles.component';
import { FunctionRolesComponent } from './features/app/function-roles/pages/function-roles/function-roles.component';
import { MembersComponent } from './features/app/members/pages/members/members.component';
import { PendingApprovalsComponent } from './features/app/pending-approvals/pages/pending-approvals/pending-approvals.component';

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
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'organizations', component: OrganizationsComponent },
      { path: 'church-roles', component: ChurchRolesComponent },
      { path: 'function-roles', component: FunctionRolesComponent },
      { path: 'members', component: MembersComponent },
      { path: 'pending-approvals', component: PendingApprovalsComponent },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/app/users/users.routes').then(
            (m) => m.USERS_ROUTES,
          ),
      },
      {
        path: 'santa-ceia',
        loadChildren: () =>
          import('./features/app/communion/communion.routes').then(
            (m) => m.COMMUNION_ROUTES,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
