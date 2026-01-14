import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  authStore = inject(AuthStore);

  tenantCode = '';
  email = '';
  password = '';

  login() {
    this.authStore.login({
      tenantCode: this.tenantCode.trim(),
      email: this.email.trim(),
      password: this.password,
    });
  }
}
