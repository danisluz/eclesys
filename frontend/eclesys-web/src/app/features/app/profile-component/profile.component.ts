import { Component, inject } from '@angular/core';
import { AuthStore } from '../../../core/auth/auth.store';
import { MatCardActions, MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  imports: [
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatDividerModule, 
    MatCardActions, 
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  authStore = inject(AuthStore);
}
