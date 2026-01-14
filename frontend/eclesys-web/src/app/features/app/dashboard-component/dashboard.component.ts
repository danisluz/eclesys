import { Component, inject } from '@angular/core';
import { AuthStore } from '../../../core/auth/auth.store';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';

@Component({
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatCardModule, MatIconModule, MatButtonModule, MatDivider],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  authStore = inject(AuthStore);
}
