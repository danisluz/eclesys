import {
  Component,
  OnInit,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MembersService } from '../../../../../shared/api/members.service';
import { Member, MemberStatus } from '../../../../../shared/models/member.model';
import { MemberFormDialogComponent } from '../../dialogs/member-form-dialog/member-form-dialog.component';
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
    MatTooltipModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatAutocompleteModule,
  ],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss'],
})
export class MembersComponent implements OnInit {
  private service = inject(MembersService);
  private organizationsService = inject(OrganizationsService);
  private churchRolesService = inject(ChurchRolesService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  // Data signals
  members = signal<Member[]>([]);
  congregations = signal<OrganizationUnit[]>([]);
  filteredCongregations = signal<OrganizationUnit[]>([]);
  selectedCongregations = signal<string[]>([]);
  churchRoles = signal<ChurchRole[]>([]);
  rootChurch = signal<OrganizationUnit | null>(null);

  // Pagination signals
  totalElements = signal(0);
  pageSize = signal(50);
  pageIndex = signal(0);
  loading = signal(true);
  sortBy = signal<
    'registrationNumber' | 'fullName' | 'email' | 'phone' | 'status'
  >('fullName');
  sortDir = signal<'asc' | 'desc'>('asc');

  // Filter states
  searchTerm = '';
  congregationSearch = '';
  selectedStatus: MemberStatus | null = null;
  selectedChurchRole: string | null = null;
  private searchTimeout: any;

  displayedColumns = [
    'registrationNumber',
    'fullName',
    'email',
    'phone',
    'congregation',
    'churchRole',
    'status',
    'actions',
  ];

  @ViewChild('congregationInput')
  congregationInput?: ElementRef<HTMLInputElement>;

  ngOnInit() {
    this.loadCongregations();
    this.loadChurchRoles();
    this.loadMembers();
  }

  loadCongregations() {
    console.log('🏛️ Carregando congregações...');
    this.organizationsService.listAll().subscribe((response) => {
      console.log('📦 Resposta da API:', response.data.length, 'organizações');
      console.log(
        '🔍 Tipos encontrados:',
        response.data.map((o) => `${o.name} (${o.type})`),
      );

      // Busca a root church para obter os labels customizados
      const rootChurch = response.data.find((org) => org.type === 'CHURCH');
      if (rootChurch) {
        this.rootChurch.set(rootChurch);
      }

      // Função recursiva para achatar a árvore e pegar todas as congregações
      const flattenCongregations = (
        orgs: OrganizationUnit[],
      ): OrganizationUnit[] => {
        const result: OrganizationUnit[] = [];
        for (const org of orgs) {
          if (org.type === 'CONGREGATION') {
            result.push(org);
          }
          if (org.children && org.children.length > 0) {
            result.push(...flattenCongregations(org.children));
          }
        }
        return result;
      };

      const congregations = flattenCongregations(response.data);
      console.log('⛪ Congregações filtradas:', congregations.length);
      console.log(
        '📋 Lista:',
        congregations.map((c) => c.name),
      );
      this.congregations.set(congregations);
      this.filteredCongregations.set(congregations);
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

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadMembers();
  }

  onSortChange(sort: Sort) {
    if (!sort.active) return;
    const active = sort.active as
      | 'registrationNumber'
      | 'fullName'
      | 'email'
      | 'phone'
      | 'status';
    this.sortBy.set(active);
    this.sortDir.set((sort.direction || 'asc') as 'asc' | 'desc');
    this.pageIndex.set(0);
    this.loadMembers();
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pageIndex.set(0); // Reset to first page on search
      this.loadMembers();
    }, 400);
  }

  onFilterChange() {
    this.pageIndex.set(0);
    this.loadMembers();
  }

  onCongregationInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.congregationSearch = input.value;
    console.log('📝 Input digitado:', this.congregationSearch);
    this.filterCongregations();
  }

  clearFilters() {
    this.searchTerm = '';
    this.congregationSearch = '';
    this.selectedStatus = null;
    this.selectedCongregations.set([]);
    this.selectedChurchRole = null;
    this.filteredCongregations.set(this.congregations());

    // Limpa o input manualmente
    if (this.congregationInput) {
      this.congregationInput.nativeElement.value = '';
    }

    this.pageIndex.set(0);
    this.loadMembers();
  }

  filterCongregations() {
    const searchTerm = this.congregationSearch.toLowerCase().trim();
    console.log('🔍 Filtrando congregações:', searchTerm);
    console.log('📋 Total de congregações:', this.congregations().length);

    if (!searchTerm) {
      this.filteredCongregations.set(this.congregations());
      console.log('✅ Mostrando todas:', this.congregations().length);
      return;
    }

    const normalized = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const normalizedSearch = normalized(searchTerm);

    const filtered = this.congregations().filter(
      (org) =>
        normalized(org.name).includes(normalizedSearch) ||
        (org.parentName &&
          normalized(org.parentName).includes(normalizedSearch)),
    );

    console.log(
      '✅ Congregações filtradas:',
      filtered.length,
      filtered.map((o) => o.name),
    );
    this.filteredCongregations.set(filtered);
  }

  selectCongregation(event: MatAutocompleteSelectedEvent) {
    const value = event.option.value as OrganizationUnit | string;
    const congregationId =
      typeof value === 'string' ? value : (value?.id ?? '');
    const current = this.selectedCongregations();
    if (congregationId && !current.includes(congregationId)) {
      this.selectedCongregations.set([...current, congregationId]);
      this.pageIndex.set(0);
      this.loadMembers();
    }
    this.congregationSearch = '';
    this.filteredCongregations.set(this.congregations());
    if (this.congregationInput) {
      this.congregationInput.nativeElement.value = '';
      this.congregationInput.nativeElement.focus();
    }
  }

  removeCongregation(id: string) {
    const current = this.selectedCongregations();
    this.selectedCongregations.set(current.filter((cid) => cid !== id));
    this.pageIndex.set(0);
    this.loadMembers();
  }

  getCongregationLabel(id: string): string {
    const org = this.congregations().find((c) => c.id === id);
    if (!org) return '';
    return org.parentName ? `${org.name} (${org.parentName})` : org.name;
  }

  getCongregationFilterLabel(): string {
    const church = this.rootChurch();
    return church?.congregationLabel ?? 'Congregações';
  }

  displayCongregation = (value: OrganizationUnit | string | null): string => {
    if (!value) return '';
    const id = typeof value === 'string' ? value : value.id;
    const org = this.congregations().find((c) => c.id === id);
    return org ? this.getCongregationLabel(org.id) : '';
  };

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
      width: '95vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMembers();
        this.notificationService.success('Membro criado com sucesso');
      }
    });
  }

  openViewDialog(member: Member) {
    this.dialog.open(MemberViewDialogComponent, {
      width: '95vw',
      maxWidth: '1400px',
      maxHeight: '90vh',
      data: { member },
    });
  }

  openTransferDialog(member: Member) {
    const dialogRef = this.dialog.open(TransferDialogComponent, {
      width: '90vw',
      maxWidth: '800px',
      data: { member },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMembers();
        this.notificationService.success('Transferência realizada com sucesso');
      }
    });
  }

  openEditDialog(member: Member) {
    const dialogRef = this.dialog.open(MemberFormDialogComponent, {
      width: '95vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: { mode: 'edit', member },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMembers();
        this.notificationService.success('Membro atualizado com sucesso');
      }
    });
  }

  openCongregationFilterDialog() {
    const dialogRef = this.dialog.open(CongregationFilterDialogComponent, {
      width: '720px',
      maxWidth: '92vw',
      data: {
        title: this.getCongregationFilterLabel(),
        congregations: this.congregations(),
        selectedIds: this.selectedCongregations(),
      },
    });

    dialogRef.afterClosed().subscribe((selectedIds: string[] | null) => {
      if (selectedIds === null) return; // cancelou

      this.selectedCongregations.set(selectedIds);
      this.pageIndex.set(0);
      this.loadMembers();
    });
  }

  formatRegistrationNumber(value: number | null | undefined): string {
    if (!value) {
      return '—';
    }
    return value.toString().padStart(6, '0');
  }
}
