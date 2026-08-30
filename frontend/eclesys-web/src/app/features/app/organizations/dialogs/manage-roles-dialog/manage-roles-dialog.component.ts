import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom } from 'rxjs';

import { OrganizationRolesService, RoleAssignment, AssignRoleRequest } from '../../../../../shared/api/organization-roles.service';
import { MembersService } from '../../../../../shared/api/members.service';
import { Member } from '../../../../../shared/models/member.model';
import { FunctionRolesService } from '../../../../../shared/api/function-roles.service';
import { FunctionRole } from '../../../../../shared/models/function-role.model';
import { NotificationService } from '../../../../../shared/services/notification.service';

export interface ManageRolesDialogData {
  organizationUnitId: string;
  organizationUnitName: string;
}

@Component({
  standalone: true,
  selector: 'app-manage-roles-dialog',
  imports: [
    FormsModule,
    AutoCompleteModule,
    SelectModule,
    TableModule,
    ButtonModule,
    ProgressSpinnerModule,
    TooltipModule,
  ],
  templateUrl: './manage-roles-dialog.component.html',
  styleUrls: ['./manage-roles-dialog.component.scss'],
})
export class ManageRolesDialogComponent implements OnInit {
  private readonly ref = inject(DynamicDialogRef);
  readonly data = inject(DynamicDialogConfig).data as ManageRolesDialogData;
  private readonly rolesService = inject(OrganizationRolesService);
  private readonly membersService = inject(MembersService);
  private readonly functionRolesService = inject(FunctionRolesService);
  private readonly notificationService = inject(NotificationService);
  readonly assignmentsTableStyle = { 'min-width': '30rem' };

  isLoading = signal(true);
  isAssigning = signal(false);
  isRemoving = signal(false);

  assignments = signal<RoleAssignment[]>([]);
  allMembers = signal<Member[]>([]);
  availableFunctionRoles = signal<FunctionRole[]>([]);
  filteredMembers: Member[] = [];

  selectedMember: Member | null = null;
  selectedRoleId: string | null = null;

  roleOptions = computed(() =>
    this.availableFunctionRoles().map((r) => ({ label: r.name, value: r.id }))
  );

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const membersResult = await firstValueFrom(
        this.membersService.listAll(undefined, undefined, undefined, undefined, 0, 500),
      );
      this.allMembers.set(membersResult?.data?.content || []);
      this.filteredMembers = [...this.allMembers()].slice(0, 10);

      const functionRolesResult = await firstValueFrom(
        this.functionRolesService.listAll(true),
      );
      this.availableFunctionRoles.set(functionRolesResult?.data || []);

      try {
        const assignmentsResult = await firstValueFrom(
          this.rolesService.listRoles(this.data.organizationUnitId),
        );
        this.assignments.set(assignmentsResult || []);
      } catch (roleError: any) {
        if (roleError?.status === 404) {
          this.assignments.set([]);
        } else {
          throw roleError;
        }
      }
    } catch (error) {
      this.notificationService.error('Erro ao carregar dados');
    } finally {
      this.isLoading.set(false);
    }
  }

  searchMembers(event: { query: string }): void {
    const term = event.query.toLowerCase().trim();
    const all = this.allMembers();
    this.filteredMembers = (term
      ? all.filter((m) => m.fullName.toLowerCase().includes(term) || m.document?.toLowerCase().includes(term))
      : all
    ).slice(0, 10);
  }

  onMemberSelected(event: AutoCompleteSelectEvent): void {
    this.selectedMember = event.value as Member;
  }

  onMemberClear(): void {
    this.selectedMember = null;
  }

  async assignRole(): Promise<void> {
    if (!this.selectedMember || !this.selectedRoleId) return;

    this.isAssigning.set(true);
    try {
      const request: AssignRoleRequest = {
        userId: this.selectedMember.id,
        functionRoleId: this.selectedRoleId,
      };
      await firstValueFrom(this.rolesService.assignRole(this.data.organizationUnitId, request));
      this.notificationService.success('Cargo atribuído com sucesso');
      await this.loadData();
      this.selectedMember = null;
      this.selectedRoleId = null;
    } catch (error: any) {
      this.notificationService.error(error?.error?.message || 'Erro ao atribuir cargo');
    } finally {
      this.isAssigning.set(false);
    }
  }

  async removeRole(assignment: RoleAssignment): Promise<void> {
    this.isRemoving.set(true);
    try {
      await firstValueFrom(
        this.rolesService.removeRole(this.data.organizationUnitId, assignment.userId, assignment.functionRoleId),
      );
      this.notificationService.success('Cargo removido com sucesso');
      await this.loadData();
    } catch (error: any) {
      this.notificationService.error(error?.error?.message || 'Erro ao remover cargo');
    } finally {
      this.isRemoving.set(false);
    }
  }

  close(): void {
    this.ref.close();
  }
}
