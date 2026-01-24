import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MembersService } from '../../../shared/api/members.service';
import { Member, MemberStatus } from '../../../shared/models/member.model';
import { MemberFormDialogComponent } from './member-form-dialog.component';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Membros</h1>
          <p class="page-subtitle">Gerencie os membros da sua organização</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Novo Membro
        </button>
      </div>

      <mat-card appearance="outlined" class="filter-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar</mat-label>
              <input
                matInput
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
                placeholder="Nome, email ou telefone"
              />
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="status-field">
              <mat-label>Status</mat-label>
              <mat-select
                [(ngModel)]="selectedStatus"
                (ngModelChange)="loadMembers()"
              >
                <mat-option [value]="null">Todos</mat-option>
                <mat-option value="ACTIVE">Ativo</mat-option>
                <mat-option value="INACTIVE">Inativo</mat-option>
                <mat-option value="TRANSFERRED">Transferido</mat-option>
                <mat-option value="DECEASED">Falecido</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-content>
          @if (loading()) {
            <p class="text-muted">Carregando...</p>
          } @else if (members().length === 0) {
            <p class="text-muted">Nenhum membro encontrado</p>
          } @else {
            <table mat-table [dataSource]="members()" class="w-full">
              <ng-container matColumnDef="fullName">
                <th mat-header-cell *matHeaderCellDef>Nome</th>
                <td mat-cell *matCellDef="let member">
                  <div>
                    <div class="member-name">{{ member.fullName }}</div>
                    @if (member.churchRoleName) {
                      <div class="member-role">
                        {{ member.churchRoleName }}
                      </div>
                    }
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="contact">
                <th mat-header-cell *matHeaderCellDef>Contato</th>
                <td mat-cell *matCellDef="let member">
                  <div class="contact-info">
                    @if (member.email) {
                      <div>{{ member.email }}</div>
                    }
                    @if (member.phone) {
                      <div>{{ member.phone }}</div>
                    }
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="w-32">Status</th>
                <td mat-cell *matCellDef="let member">
                  <mat-chip-set>
                    <mat-chip [class]="'status-' + member.status.toLowerCase()">
                      {{ getStatusLabel(member.status) }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="w-32">Ações</th>
                <td mat-cell *matCellDef="let member">
                  <button mat-icon-button (click)="openEditDialog(member)">
                    <mat-icon>edit</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .w-32 {
        width: 8rem;
      }
      .w-full {
        width: 100%;
      }
      .text-muted {
        color: rgba(0, 0, 0, 0.6);
        padding: 2rem;
        text-align: center;
      }
      .filter-card {
        margin-bottom: 1.5rem;
      }
      .filters {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      .search-field {
        flex: 1;
        max-width: 400px;
      }
      .status-field {
        width: 200px;
      }
      .member-name {
        font-weight: 500;
      }
      .member-role {
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.6);
      }
      .contact-info {
        font-size: 0.875rem;
      }
      .status-active {
        background-color: #e8f5e9 !important;
        color: #2e7d32 !important;
      }
      .status-inactive {
        background-color: #fff3e0 !important;
        color: #ef6c00 !important;
      }
      .status-transferred {
        background-color: #e3f2fd !important;
        color: #1565c0 !important;
      }
      .status-deceased {
        background-color: #f5f5f5 !important;
        color: #616161 !important;
      }
    `,
  ],
})
export class MembersComponent implements OnInit {
  private service = inject(MembersService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  members = signal<Member[]>([]);
  loading = signal(true);
  searchTerm = '';
  selectedStatus: MemberStatus | null = null;
  private searchTimeout: any;

  displayedColumns = ['fullName', 'contact', 'status', 'actions'];

  ngOnInit() {
    this.loadMembers();
  }

  loadMembers() {
    this.loading.set(true);
    const search = this.searchTerm.trim() || undefined;
    this.service.listAll(this.selectedStatus ?? undefined, search).subscribe({
      next: (response) => {
        this.members.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadMembers();
    }, 500);
  }

  getStatusLabel(status: MemberStatus): string {
    const labels: Record<MemberStatus, string> = {
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      TRANSFERRED: 'Transferido',
      DECEASED: 'Falecido',
    };
    return labels[status];
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(MemberFormDialogComponent, {
      width: '700px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMembers();
        this.snackBar.open('Membro criado com sucesso', 'Fechar', {
          duration: 3000,
        });
      }
    });
  }

  openEditDialog(member: Member) {
    const dialogRef = this.dialog.open(MemberFormDialogComponent, {
      width: '700px',
      data: { mode: 'edit', member },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMembers();
        this.snackBar.open('Membro atualizado com sucesso', 'Fechar', {
          duration: 3000,
        });
      }
    });
  }
}
