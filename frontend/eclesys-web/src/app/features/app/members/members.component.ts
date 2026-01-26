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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MembersService } from '../../../shared/api/members.service';
import { Member, MemberStatus } from '../../../shared/models/member.model';
import { PageResponse } from '../../../shared/models/page.model';
import { MemberFormDialogComponent } from './member-form-dialog.component';
import { TransferDialogComponent } from './transfer-dialog.component';
import { MemberViewDialogComponent } from './member-view-dialog.component';
import { OrganizationsService } from '../../../shared/api/organizations.service';
import { OrganizationUnit } from '../../../shared/api/organization-unit.model';
import { ChurchRolesService } from '../../../shared/api/church-roles.service';
import { ChurchRole } from '../../../shared/models/church-role.model';

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
    MatAutocompleteModule,
  ],
  template: `
    <div class="page-fullscreen">
      <div class="page-header">
        <div>
          <h1 class="page-title">Membros</h1>
          <p class="page-subtitle">{{ totalElements() }} membros cadastrados</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Novo Membro
        </button>
      </div>

      <mat-card appearance="outlined" class="filter-card">
        <mat-card-content>
          <div class="filters-grid">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar</mat-label>
              <input
                matInput
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
                placeholder="Nome, email ou telefone"
              />
              <mat-icon matPrefix>search</mat-icon>
              @if (searchTerm) {
                <button
                  matSuffix
                  mat-icon-button
                  (click)="searchTerm = ''; loadMembers()"
                >
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="congregation-field">
              <mat-label>{{ getCongregationFilterLabel() }}</mat-label>
              <mat-chip-grid #chipGrid>
                @for (id of selectedCongregations(); track id) {
                  <mat-chip-row (removed)="removeCongregation(id)">
                    {{ getCongregationLabel(id) }}
                    <button matChipRemove>
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                }
              </mat-chip-grid>
              <input
                #congregationInput
                matInput
                [(ngModel)]="congregationSearch"
                (input)="onCongregationInput($event)"
                [matAutocomplete]="autoCongregation"
                [matChipInputFor]="chipGrid"
                placeholder="Busque e selecione..."
              />
              <mat-autocomplete
                #autoCongregation="matAutocomplete"
                [autoActiveFirstOption]="true"
                (optionSelected)="selectCongregation($event)"
              >
                @if (filteredCongregations().length === 0) {
                  <mat-option disabled
                    >Nenhuma congregação encontrada</mat-option
                  >
                }
                @for (org of filteredCongregations(); track org.id) {
                  <mat-option [value]="org.id">
                    <div class="congregation-option">
                      <span class="congregation-name">{{ org.name }}</span>
                      @if (org.parentName) {
                        <span class="congregation-parent">{{
                          org.parentName
                        }}</span>
                      }
                    </div>
                  </mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Cargo Eclesiástico</mat-label>
              <mat-select
                [(ngModel)]="selectedChurchRole"
                (ngModelChange)="loadMembers()"
              >
                <mat-option [value]="null">Todos</mat-option>
                @for (role of churchRoles(); track role.id) {
                  <mat-option [value]="role.id">{{ role.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
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

            <button
              mat-stroked-button
              (click)="clearFilters()"
              class="clear-filters-btn"
            >
              <mat-icon>filter_alt_off</mat-icon>
              Limpar Filtros
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined" class="table-card">
        <mat-card-content>
          @if (loading()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Carregando membros...</p>
            </div>
          } @else if (members().length === 0) {
            <div class="empty-state">
              <mat-icon>group</mat-icon>
              <p>Nenhum membro encontrado</p>
              <p class="empty-subtitle">
                Ajuste os filtros ou adicione um novo membro
              </p>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="members()" class="members-table">
                <ng-container matColumnDef="fullName">
                  <th mat-header-cell *matHeaderCellDef>Nome</th>
                  <td mat-cell *matCellDef="let member">
                    <span class="member-name">{{ member.fullName }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>E-mail</th>
                  <td mat-cell *matCellDef="let member">
                    <span class="text-secondary">{{
                      member.email || '—'
                    }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="phone">
                  <th mat-header-cell *matHeaderCellDef>Telefone</th>
                  <td mat-cell *matCellDef="let member">
                    <span class="text-secondary">{{
                      member.phone || '—'
                    }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="congregation">
                  <th mat-header-cell *matHeaderCellDef>Congregação</th>
                  <td mat-cell *matCellDef="let member">
                    <span class="text-secondary">{{
                      member.organizationUnitName || '—'
                    }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="churchRole">
                  <th mat-header-cell *matHeaderCellDef>Cargo</th>
                  <td mat-cell *matCellDef="let member">
                    <span class="text-secondary">{{
                      member.churchRoleName || '—'
                    }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let member">
                    <mat-chip-set>
                      <mat-chip
                        [class]="'status-' + member.status.toLowerCase()"
                      >
                        {{ getStatusLabel(member.status) }}
                      </mat-chip>
                    </mat-chip-set>
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Ações</th>
                  <td mat-cell *matCellDef="let member">
                    <div class="action-buttons">
                      <button
                        mat-icon-button
                        (click)="openViewDialog(member)"
                        matTooltip="Visualizar"
                      >
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        (click)="openTransferDialog(member)"
                        matTooltip="Transferir"
                      >
                        <mat-icon>swap_horiz</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        (click)="openEditDialog(member)"
                        matTooltip="Editar"
                      >
                        <mat-icon>edit</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns"
                  class="table-row"
                ></tr>
              </table>
            </div>

            <mat-paginator
              [length]="totalElements()"
              [pageSize]="pageSize()"
              [pageIndex]="pageIndex()"
              [pageSizeOptions]="[25, 50, 100, 200]"
              (page)="onPageChange($event)"
              showFirstLastButtons
            >
            </mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .page-fullscreen {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 1rem;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .page-title {
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
      }
      .page-subtitle {
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.6);
        margin: 0;
      }
      .filter-card {
        flex-shrink: 0;
      }
      .filters-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr auto;
        gap: 1rem;
        align-items: start;
      }
      @media (max-width: 1200px) {
        .filters-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 768px) {
        .filters-grid {
          grid-template-columns: 1fr;
        }
      }
      .search-field {
        min-width: 0;
      }
      .clear-filters-btn {
        margin-top: 0.5rem;
      }
      .table-card {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .table-card mat-card-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 0 !important;
        min-height: 0;
      }
      .loading-container,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        gap: 1rem;
        color: rgba(0, 0, 0, 0.6);
      }
      .empty-state mat-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: rgba(0, 0, 0, 0.3);
      }
      .empty-subtitle {
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.4);
      }
      .table-container {
        flex: 1;
        overflow: auto;
      }

      .members-table {
        width: 100%;
      }

      .members-table th {
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
        background-color: #fafafa;
        padding: 1rem 1.5rem;
      }

      .members-table td {
        padding: 1rem 1.5rem;
      }

      .table-row {
        transition: background-color 0.2s;
      }

      .table-row:hover {
        background-color: #f5f5f5;
      }

      .member-name {
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }

      .text-secondary {
        color: rgba(0, 0, 0, 0.6);
        font-size: 0.9375rem;
      }

      .action-buttons {
        display: flex;
        gap: 0.25rem;
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
      mat-paginator {
        border-top: 1px solid rgba(0, 0, 0, 0.12);
      }
      .congregation-field {
        min-width: 250px;
      }
      .congregation-option {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }
      .congregation-name {
        font-weight: 500;
      }
      .congregation-parent {
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.5);
      }
      mat-chip-grid {
        margin-bottom: 0.5rem;
      }
    `,
  ],
})
export class MembersComponent implements OnInit {
  private service = inject(MembersService);
  private organizationsService = inject(OrganizationsService);
  private churchRolesService = inject(ChurchRolesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

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

  // Filter states
  searchTerm = '';
  congregationSearch = '';
  selectedStatus: MemberStatus | null = null;
  selectedChurchRole: string | null = null;
  private searchTimeout: any;

  displayedColumns = [
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
        'fullName',
        'asc',
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

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pageIndex.set(0); // Reset to first page on search
      this.loadMembers();
    }, 400);
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

  selectCongregation(event: any) {
    const congregationId = event.option.value;
    const current = this.selectedCongregations();
    if (!current.includes(congregationId)) {
      this.selectedCongregations.set([...current, congregationId]);
      this.pageIndex.set(0);
      this.loadMembers();
    }
    this.congregationSearch = '';
    this.filteredCongregations.set(this.congregations());
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
        this.snackBar.open('Membro criado com sucesso', 'Fechar', {
          duration: 3000,
        });
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
        this.snackBar.open('Transferência realizada com sucesso', 'Fechar', {
          duration: 3000,
        });
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
        this.snackBar.open('Membro atualizado com sucesso', 'Fechar', {
          duration: 3000,
        });
      }
    });
  }
}
