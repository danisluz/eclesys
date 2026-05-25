import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { DrawerModule } from 'primeng/drawer';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { MembersService } from '../../../../../shared/api/members.service';
import {
  Member,
  MemberStatus,
} from '../../../../../shared/models/member.model';
import { TransferDialogComponent } from '../../dialogs/transfer-dialog/transfer-dialog.component';
import { MemberViewDialogComponent } from '../../dialogs/member-view-dialog/member-view-dialog.component';
import { OrganizationsService } from '../../../../../shared/api/organizations.service';
import { OrganizationUnit } from '../../../../../shared/api/organization-unit.model';
import { ChurchRolesService } from '../../../../../shared/api/church-roles.service';
import { ChurchRole } from '../../../../../shared/models/church-role.model';
import { CongregationFilterDialogComponent } from '../../../../../shared/ui/congregation-filter-dialog/congregation-filter-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    FormsModule,
    DrawerModule,
    TableModule,
    SelectModule,
    InputTextModule,
    TagModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    MemberViewDialogComponent,
    TransferDialogComponent,
  ],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss'],
})
export class MembersComponent implements OnInit {
  private readonly service = inject(MembersService);
  private readonly organizationsService = inject(OrganizationsService);
  private readonly churchRolesService = inject(ChurchRolesService);
  private readonly dialogService = inject(DialogService);
  readonly notificationService = inject(NotificationService);
  readonly router = inject(Router);

  @ViewChild('membersTable') membersTable?: Table;

  members = signal<Member[]>([]);
  congregations = signal<OrganizationUnit[]>([]);
  selectedCongregations = signal<string[]>([]);
  churchRoles = signal<ChurchRole[]>([]);
  rootChurch = signal<OrganizationUnit | null>(null);

  totalElements = signal(0);
  pageSize = signal(50);
  pageIndex = signal(0);
  loading = signal(true);
  sortBy = signal<
    'registrationNumber' | 'fullName' | 'email' | 'phone' | 'status'
  >('fullName');
  sortDir = signal<'asc' | 'desc'>('asc');

  // Drawer state
  viewDrawerVisible = signal(false);
  transferDrawerVisible = signal(false);
  selectedMember = signal<Member | null>(null);

  searchTerm = '';
  selectedStatus: MemberStatus | null = null;
  selectedChurchRole: string | null = null;
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;

  statusOptions = [
    { label: 'Ativo', value: 'ACTIVE' as MemberStatus },
    { label: 'Inativo', value: 'INACTIVE' as MemberStatus },
    { label: 'Transferido', value: 'TRANSFERRED' as MemberStatus },
    { label: 'Falecido', value: 'DECEASED' as MemberStatus },
  ];

  ngOnInit() {
    this.loadCongregations();
    this.loadChurchRoles();
  }

  loadCongregations() {
    this.organizationsService.listAll().subscribe((response) => {
      const rootChurch = response.data.find((org) => org.type === 'CHURCH');
      if (rootChurch) this.rootChurch.set(rootChurch);

      const flatten = (orgs: OrganizationUnit[]): OrganizationUnit[] => {
        const result: OrganizationUnit[] = [];
        for (const org of orgs) {
          if (org.type === 'CONGREGATION') result.push(org);
          if (org.children?.length) result.push(...flatten(org.children));
        }
        return result;
      };

      this.congregations.set(flatten(response.data));
    });
  }

  loadChurchRoles() {
    this.churchRolesService
      .listAll()
      .subscribe((response) => this.churchRoles.set(response.data));
  }

  loadMembers() {
    this.loading.set(true);
    const search = this.searchTerm.trim() || undefined;
    const selectedCongs = this.selectedCongregations();
    const organizationUnitIds =
      selectedCongs.length > 0 ? selectedCongs : undefined;

    this.service
      .listAll(
        this.selectedStatus ?? undefined,
        search,
        organizationUnitIds,
        this.selectedChurchRole ?? undefined,
        this.pageIndex(),
        this.pageSize(),
        this.sortBy(),
        this.sortDir(),
      )
      .subscribe({
        next: (response) => {
          this.members.set(response.data.content);
          this.totalElements.set(response.data.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  onLazyLoad(event: TableLazyLoadEvent) {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    this.pageIndex.set(Math.floor(first / rows));
    this.pageSize.set(rows);
    if (event.sortField) {
      this.sortBy.set(
        event.sortField as
          | 'registrationNumber'
          | 'fullName'
          | 'email'
          | 'phone'
          | 'status',
      );
      this.sortDir.set((event.sortOrder ?? 1) === 1 ? 'asc' : 'desc');
    }
    this.loadMembers();
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.resetPagination();
      this.loadMembers();
    }, 400);
  }

  onFilterChange() {
    this.resetPagination();
    this.loadMembers();
  }

  private resetPagination() {
    this.pageIndex.set(0);
    if (this.membersTable) this.membersTable.first = 0;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedCongregations.set([]);
    this.selectedChurchRole = null;
    this.resetPagination();
    this.loadMembers();
  }

  getCongregationFilterLabel(): string {
    const church = this.rootChurch();
    return church?.congregationLabel ?? 'Congregações';
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

  getStatusSeverity(
    status: MemberStatus,
  ): 'success' | 'warn' | 'info' | 'secondary' {
    const map: Record<MemberStatus, 'success' | 'warn' | 'info' | 'secondary'> =
      {
        ACTIVE: 'success',
        INACTIVE: 'warn',
        TRANSFERRED: 'info',
        DECEASED: 'secondary',
      };
    return map[status];
  }

  openCreateDialog() {
    this.router.navigate(['/app/members/new']);
  }

  openViewDialog(member: Member) {
    this.selectedMember.set(member);
    this.viewDrawerVisible.set(true);
  }

  openTransferDialog(member: Member) {
    this.selectedMember.set(member);
    this.transferDrawerVisible.set(true);
  }

  openEditDialog(member: Member) {
    this.router.navigate(['/app/members', member.id, 'edit']);
  }

  openCongregationFilterDialog() {
    const ref = this.dialogService.open(CongregationFilterDialogComponent, {
      header: this.getCongregationFilterLabel(),
      width: '720px',
      data: {
        title: this.getCongregationFilterLabel(),
        congregations: this.congregations(),
        selectedIds: this.selectedCongregations(),
      },
    });
    ref?.onClose.subscribe((selectedIds: string[] | null) => {
      if (selectedIds === null) return;
      this.selectedCongregations.set(selectedIds);
      this.resetPagination();
      this.loadMembers();
    });
  }

  formatRegistrationNumber(value: number | null | undefined): string {
    if (!value) return '—';
    return value.toString().padStart(6, '0');
  }
}
