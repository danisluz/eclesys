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
  templateUrl: './manage-roles-dialog.component.html',
  styleUrls: ['./manage-roles-dialog.component.scss'],

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
