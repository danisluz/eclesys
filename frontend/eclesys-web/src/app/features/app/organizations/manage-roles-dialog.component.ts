import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { firstValueFrom } from 'rxjs';

import {
  OrganizationRolesService,
  RoleAssignment,
  AssignRoleRequest,
} from '../../../shared/api/organization-roles.service';
import { MembersService } from '../../../shared/api/members.service';
import { Member } from '../../../shared/models/member.model';
import { FunctionRolesService } from '../../../shared/api/function-roles.service';
import { FunctionRole } from '../../../shared/models/function-role.model';

export interface ManageRolesDialogData {
  organizationUnitId: string;
  organizationUnitName: string;
}

@Component({
  standalone: true,
  selector: 'app-manage-roles-dialog',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatTableModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>badge</mat-icon>
      Gerenciar Cargos - {{ data.organizationUnitName }}
    </h2>

    <mat-dialog-content>
      @if (isLoading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Carregando...</p>
        </div>
      } @else {
        <!-- Formulário para atribuir novo cargo -->
        <div class="assign-section">
          <h3>Atribuir Cargo Administrativo</h3>
          <div class="assign-form">
            <mat-form-field appearance="outline" class="member-field">
              <mat-label>Buscar Membro</mat-label>
              <input
                matInput
                [(ngModel)]="selectedMember"
                (input)="onInputChange($event)"
                [matAutocomplete]="auto"
                placeholder="Digite o nome do membro"
              />
              <mat-icon matPrefix>search</mat-icon>
              @if (selectedMember) {
                <button
                  matSuffix
                  mat-icon-button
                  (click)="clearMemberSearch()"
                  aria-label="Limpar"
                >
                  <mat-icon>close</mat-icon>
                </button>
              }
              <mat-autocomplete
                #auto="matAutocomplete"
                [displayWith]="displayMember"
              >
                @if (isSearchingMembers()) {
                  <mat-option disabled>
                    <mat-spinner diameter="20"></mat-spinner>
                    Buscando...
                  </mat-option>
                } @else if (filteredMembers().length === 0) {
                  <mat-option disabled>
                    Digite para buscar membros...
                  </mat-option>
                } @else {
                  @for (member of filteredMembers(); track member.id) {
                    <mat-option [value]="member">
                      <div class="member-option">
                        <strong>{{ member.fullName }}</strong>
                        @if (member.document) {
                          <small>{{ member.document }}</small>
                        }
                      </div>
                    </mat-option>
                  }
                }
              </mat-autocomplete>
            </mat-form-field>

            <mat-form-field appearance="outline" class="role-field">
              <mat-label>Cargo Administrativo</mat-label>
              <mat-select [(ngModel)]="selectedRole">
                <mat-option value="">Selecione um cargo</mat-option>
                @for (role of availableFunctionRoles(); track role.id) {
                  <mat-option [value]="role.id">
                    {{ role.name }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              (click)="assignRole()"
              [disabled]="!selectedMember || !selectedRole || isAssigning()"
              class="assign-btn"
            >
              <mat-icon>add</mat-icon>
              Atribuir
            </button>
          </div>

          @if (selectedMember) {
            <div class="selected-member">
              <mat-icon>person</mat-icon>
              <span
                ><strong>Membro selecionado:</strong>
                {{ selectedMember.fullName }}</span
              >
              <button
                mat-icon-button
                (click)="clearSelectedMember()"
                matTooltip="Remover seleção"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>

        <!-- Lista de cargos atribuídos -->
        <div class="assignments-section">
          <h3>Cargos Atribuídos ({{ assignments().length }})</h3>
          @if (assignments().length === 0) {
            <p class="empty-message">Nenhum cargo atribuído nesta unidade.</p>
          } @else {
            <table
              mat-table
              [dataSource]="assignments()"
              class="mat-elevation-z1"
            >
              <!-- Coluna Nome -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Membro</th>
                <td mat-cell *matCellDef="let assignment">
                  {{ assignment.userName }}
                </td>
              </ng-container>

              <!-- Coluna Cargo -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Cargo</th>
                <td mat-cell *matCellDef="let assignment">
                  {{ assignment.functionRoleName }}
                </td>
              </ng-container>

              <!-- Coluna Ações -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="actions-column">
                  Ações
                </th>
                <td
                  mat-cell
                  *matCellDef="let assignment"
                  class="actions-column"
                >
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="removeRole(assignment)"
                    [disabled]="isRemoving()"
                    matTooltip="Remover cargo"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        gap: 1rem;
      }

      .assign-section {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }

      .assign-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }

      .assign-form {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 1rem;
        align-items: flex-start;

        .member-field,
        .role-field {
          width: 100%;
        }

        .assign-btn {
          margin-top: 0.5rem;
        }
      }

      .member-option {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        small {
          color: rgba(0, 0, 0, 0.6);
          font-size: 0.75rem;
        }
      }

      .selected-member {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
        padding: 0.75rem;
        background-color: #e3f2fd;
        border-radius: 4px;
        color: #1976d2;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        span {
          flex: 1;
        }
      }

      .max-holders {
        color: rgba(0, 0, 0, 0.6);
        font-size: 0.875rem;
        margin-left: 0.5rem;
      }

      .assignments-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }

      .empty-message {
        color: rgba(0, 0, 0, 0.6);
        font-style: italic;
        padding: 1rem;
        text-align: center;
      }

      table {
        width: 100%;
        background: white;
      }

      .actions-column {
        width: 80px;
        text-align: right;
      }

      mat-dialog-content {
        min-width: 700px;
        max-width: 900px;
        min-height: 400px;
      }

      @media (max-width: 768px) {
        .assign-form {
          grid-template-columns: 1fr;
        }

        mat-dialog-content {
          min-width: auto;
          max-width: 100%;
        }
      }
    `,
  ],
})
export class ManageRolesDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ManageRolesDialogComponent>);
  protected readonly data = inject<ManageRolesDialogData>(MAT_DIALOG_DATA);
  private readonly rolesService = inject(OrganizationRolesService);
  private readonly membersService = inject(MembersService);
  private readonly functionRolesService = inject(FunctionRolesService);
  private readonly snackBar = inject(MatSnackBar);

  isLoading = signal(true);
  isAssigning = signal(false);
  isRemoving = signal(false);
  isSearchingMembers = signal(false);

  assignments = signal<RoleAssignment[]>([]);
  allMembers = signal<Member[]>([]);
  availableFunctionRoles = signal<FunctionRole[]>([]);

  selectedMember: Member | null = null;
  selectedRole: string | '' = '';
  memberSearchText = signal('');

  readonly displayedColumns = ['name', 'role', 'actions'];

  filteredMembers = computed(() => {
    const search = this.memberSearchText().toLowerCase().trim();

    // Se não houver busca, mostra os primeiros 10 membros
    if (!search) {
      return this.allMembers().slice(0, 10);
    }

    // Se busca muito curta, não filtra
    if (search.length < 1) {
      return [];
    }

    const filtered = this.allMembers()
      .filter(
        (member) =>
          member.fullName.toLowerCase().includes(search) ||
          member.document?.toLowerCase().includes(search),
      )
      .slice(0, 10); // Limitar a 10 resultados

    return filtered;
  });

  displayMember = (member: Member | null): string => {
    return member?.fullName || '';
  };

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.memberSearchText.set(input.value);

    // Se o input não corresponde ao membro selecionado, limpar seleção
    if (this.selectedMember && input.value !== this.selectedMember.fullName) {
      this.selectedMember = null;
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Carregar membros
      const membersResult = await firstValueFrom(
        this.membersService.listAll(
          undefined,
          undefined,
          undefined,
          undefined,
          0,
          500,
        ),
      );
      this.allMembers.set(membersResult?.data?.content || []);

      // Carregar funções administrativas ativas
      const functionRolesResult = await firstValueFrom(
        this.functionRolesService.listAll(true),
      );
      this.availableFunctionRoles.set(functionRolesResult?.data || []);

      // Carregar atribuições existentes (pode retornar 404 se não houver nenhuma)
      try {
        const assignmentsResult = await firstValueFrom(
          this.rolesService.listRoles(this.data.organizationUnitId),
        );
        this.assignments.set(assignmentsResult || []);
      } catch (roleError: any) {
        // Se for 404, não há cargos atribuídos ainda (não é um erro)
        if (roleError?.status === 404) {
          this.assignments.set([]);
        } else {
          throw roleError;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      this.snackBar.open('Erro ao carregar dados', 'Fechar', {
        duration: 3000,
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  onMemberSearchChange(value: string): void {
    // Não usado mais
  }

  onMemberSelected(member: any): void {
    // Não usado mais
  }

  clearMemberSearch(): void {
    this.memberSearchText.set('');
    this.selectedMember = null;
  }

  clearSelectedMember(): void {
    this.selectedMember = null;
    this.memberSearchText.set('');
  }

  async assignRole(): Promise<void> {
    if (!this.selectedMember || !this.selectedRole) {
      return;
    }

    this.isAssigning.set(true);
    try {
      const request: AssignRoleRequest = {
        userId: this.selectedMember.id,
        functionRoleId: this.selectedRole, // agora é UUID do FunctionRole
      };

      console.log('[assignRole] Request:', request);

      await firstValueFrom(
        this.rolesService.assignRole(this.data.organizationUnitId, request),
      );

      this.snackBar.open('Cargo atribuído com sucesso', 'Fechar', {
        duration: 3000,
      });

      await this.loadData();

      this.clearSelectedMember();
      this.selectedRole = '';
    } catch (error: any) {
      const message = error?.error?.message || 'Erro ao atribuir cargo';
      this.snackBar.open(message, 'Fechar', { duration: 5000 });
    } finally {
      this.isAssigning.set(false);
    }
  }

  async removeRole(assignment: RoleAssignment): Promise<void> {
    this.isRemoving.set(true);
    try {
      await firstValueFrom(
        this.rolesService.removeRole(
          this.data.organizationUnitId,
          assignment.userId,
          assignment.functionRoleId,
        ),
      );

      this.snackBar.open('Cargo removido com sucesso', 'Fechar', {
        duration: 3000,
      });

      await this.loadData();
    } catch (error: any) {
      const message = error?.error?.message || 'Erro ao remover cargo';
      this.snackBar.open(message, 'Fechar', { duration: 5000 });
    } finally {
      this.isRemoving.set(false);
    }
  }
}
