import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { afterNextRender } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UsersStore } from '../../data/users.store';
import { UserFormDialogComponent } from '../../components/user-form-dialog/user-form-dialog.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.scss'],
})
export class UsersPageComponent {
  usersStore = inject(UsersStore);
  matDialog = inject(MatDialog);

  constructor() {
    afterNextRender(() => {
      // sem ngOnInit: carrega assim que a view estabiliza
      this.usersStore.loadUsers();
    });
  }

  openCreateDialog(): void {
  this.usersStore.clearCreateError();

  const dialogRef = this.matDialog.open(UserFormDialogComponent, {
    width: '640px',
    maxWidth: '92vw',
    autoFocus: false,
  });

  dialogRef.afterClosed().subscribe();
}


  reload(): void {
    this.usersStore.loadUsers();
  }
}
