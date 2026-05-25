import {
  Component,
  inject,
  signal,
  OnInit,
  computed,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuModule, Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { OrganizationsService } from '../../../../../shared/api/organizations.service';
import {
  OrganizationUnit,
  OrganizationUnitType,
  CreateOrganizationUnitRequest,
  UpdateOrganizationUnitRequest,
} from '../../../../../shared/api/organization-unit.model';
import {
  OrganizationFormDialogComponent,
  OrganizationFormDialogData,
} from '../../dialogs/organization-form-dialog/organization-form-dialog.component';
import {
  ManageRolesDialogComponent,
  ManageRolesDialogData,
} from '../../dialogs/manage-roles-dialog/manage-roles-dialog.component';
import {
  ViewHierarchyDialogComponent,
  ViewHierarchyDialogData,
} from '../../dialogs/view-hierarchy-dialog/view-hierarchy-dialog.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  standalone: true,
  selector: 'app-organizations',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    MenuModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.scss'],
})
export class OrganizationsComponent implements OnInit {
  private readonly organizationsService = inject(OrganizationsService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialogService = inject(DialogService);

  @ViewChild('rowMenu') rowMenu!: Menu;

  organizations = signal<OrganizationUnit[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  searchTerm = signal('');
  typeFilter = signal<OrganizationUnitType | 'ALL'>('ALL');
  headquartersFilter = signal<'ALL' | 'HEADQUARTERS' | 'NOT_HEADQUARTERS'>(
    'ALL',
  );

  rowMenuItems: MenuItem[] = [];

  typeOptions = computed(() => [
    { label: 'Todos', value: 'ALL' },
    { label: 'Igreja (Sede Principal)', value: OrganizationUnitType.CHURCH },
    { label: this.getSectorLabel(), value: OrganizationUnitType.SECTOR },
    {
      label: this.getCongregationLabel(),
      value: OrganizationUnitType.CONGREGATION,
    },
  ]);

  hqOptions = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Apenas Sedes', value: 'HEADQUARTERS' },
    { label: 'Não-Sedes', value: 'NOT_HEADQUARTERS' },
  ];

  filteredUnits = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const type = this.typeFilter();
    const hq = this.headquartersFilter();

    let units = this.getAllUnitsFlat();

    if (type !== 'ALL') units = units.filter((u) => u.type === type);
    if (hq === 'HEADQUARTERS') units = units.filter((u) => u.isHeadquarters);
    else if (hq === 'NOT_HEADQUARTERS')
      units = units.filter((u) => !u.isHeadquarters);

    if (term) {
      units = units.filter((u) => {
        const normalized = (s: string) =>
          s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const t = normalized(term);
        return (
          normalized(u.name ?? '').includes(t) ||
          normalized(u.code ?? '').includes(t) ||
          normalized(this.getTypeLabel(u.type)).includes(t) ||
          normalized(this.getParentName(u)).includes(t)
        );
      });
    }

    return units;
  });

  OrganizationUnitType = OrganizationUnitType;

  ngOnInit() {
    this.loadOrganizations();
  }

  private getRootChurch(): OrganizationUnit | undefined {
    return this.organizations().find(
      (org) => org.type === OrganizationUnitType.CHURCH,
    );
  }

  loadOrganizations() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.organizationsService.listAll().subscribe({
      next: (response) => {
        this.organizations.set(response.data);
        this.isLoading.set(false);
      },
      error: (error) => {
        const message =
          error?.error?.message ?? 'Erro ao carregar organizações';
        this.errorMessage.set(message);
        this.isLoading.set(false);
      },
    });
  }

  getTypeLabel(type: OrganizationUnitType): string {
    const church = this.getRootChurch();
    const labels = {
      [OrganizationUnitType.CHURCH]: 'Sede Central',
      [OrganizationUnitType.SECTOR]: church?.sectorLabel ?? 'Setor',
      [OrganizationUnitType.CONGREGATION]:
        church?.congregationLabel ?? 'Congregação',
    };
    return labels[type] || type;
  }

  getTypeIcon(type: OrganizationUnitType): string {
    const icons = {
      [OrganizationUnitType.CHURCH]: 'pi-building',
      [OrganizationUnitType.SECTOR]: 'pi-folder',
      [OrganizationUnitType.CONGREGATION]: 'pi-users',
    };
    return icons[type] || 'pi-map-marker';
  }

  getSectorLabel(): string {
    return this.getRootChurch()?.sectorLabel ?? 'Setor';
  }

  getCongregationLabel(): string {
    return this.getRootChurch()?.congregationLabel ?? 'Congregação';
  }

  getAllUnitsFlat(): OrganizationUnit[] {
    const result: OrganizationUnit[] = [];
    for (const church of this.organizations()) {
      result.push(church);
      if (church.children) {
        for (const sector of church.children) {
          result.push(sector);
          if (sector.children) result.push(...sector.children);
        }
      }
    }
    return result;
  }

  getParentName(unit: OrganizationUnit): string {
    if (unit.type === OrganizationUnitType.CHURCH) return '—';
    for (const church of this.organizations()) {
      if (
        unit.type === OrganizationUnitType.SECTOR &&
        unit.parentId === church.id
      )
        return church.name;
      if (church.children) {
        for (const sector of church.children) {
          if (
            unit.type === OrganizationUnitType.CONGREGATION &&
            unit.parentId === sector.id
          )
            return sector.name;
        }
      }
    }
    return '—';
  }

  getHeadquartersLabel(type: OrganizationUnitType): string {
    if (type === OrganizationUnitType.CHURCH) return 'Sede Principal';
    if (type === OrganizationUnitType.CONGREGATION)
      return `Sede ${this.getSectorLabel()}`;
    return 'Sede';
  }

  openRowMenu(event: Event, unit: OrganizationUnit) {
    const items: MenuItem[] = [
      {
        label: 'Visualizar Hierarquia',
        icon: 'pi pi-eye',
        command: () => this.openViewHierarchyDialog(unit.id),
      },
      {
        label: 'Gerenciar Cargos',
        icon: 'pi pi-id-card',
        command: () => this.openManageRolesDialog(unit),
      },
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.openEditDialog(unit),
      },
    ];
    const addSectorItem =
      unit.type === OrganizationUnitType.CHURCH
        ? [
            {
              label: `Adicionar ${this.getSectorLabel()}`,
              icon: 'pi pi-plus',
              command: () => this.openCreateDialog(unit.id, unit.type),
            },
          ]
        : [];

    const addCongregationItem =
      unit.type === OrganizationUnitType.SECTOR
        ? [
            {
              label: `Adicionar ${this.getCongregationLabel()}`,
              icon: 'pi pi-plus',
              command: () => this.openCreateDialog(unit.id, unit.type),
            },
          ]
        : [];

    this.rowMenuItems = [
      ...items,
      ...addSectorItem,
      ...addCongregationItem,
      { separator: true },
      {
        label: 'Excluir',
        icon: 'pi pi-trash',
        styleClass: 'danger-item',
        command: () => this.deleteUnit(unit),
      },
    ];
    this.rowMenu.toggle(event);
  }

  clearFilters() {
    this.searchTerm.set('');
    this.typeFilter.set('ALL');
    this.headquartersFilter.set('ALL');
  }

  openCreateDialog(parentId?: string, parentType?: OrganizationUnitType) {
    const dialogData: OrganizationFormDialogData = {
      mode: 'create',
      parentId,
      parentType,
      allUnits: this.organizations(),
    };
    const ref = this.dialogService.open(OrganizationFormDialogComponent, {
      header: 'Nova Unidade',
      width: '500px',
      data: dialogData,
    });
    if (!ref) return;
    ref.onClose.subscribe((request: CreateOrganizationUnitRequest) => {
      if (!request) return;
      this.organizationsService.create(request).subscribe({
        next: () => {
          this.notificationService.success('Unidade criada com sucesso');
          this.loadOrganizations();
        },
        error: (error) => {
          const message = error?.error?.message ?? 'Erro ao criar unidade';
          this.notificationService.error(message);
        },
      });
    });
  }

  openEditDialog(unit: OrganizationUnit) {
    const dialogData: OrganizationFormDialogData = { mode: 'edit', unit };
    const ref = this.dialogService.open(OrganizationFormDialogComponent, {
      header: 'Editar Unidade',
      width: '500px',
      data: dialogData,
    });
    if (!ref) return;
    ref.onClose.subscribe((request: UpdateOrganizationUnitRequest) => {
      if (!request) return;
      this.organizationsService.update(unit.id, request).subscribe({
        next: () => {
          this.notificationService.success('Unidade atualizada com sucesso');
          this.loadOrganizations();
        },
        error: (error) => {
          const message = error?.error?.message ?? 'Erro ao atualizar unidade';
          this.notificationService.error(message);
        },
      });
    });
  }

  deleteUnit(unit: OrganizationUnit) {
    if (!confirm(`Tem certeza que deseja excluir "${unit.name}"?`)) return;
    this.organizationsService.delete(unit.id).subscribe({
      next: () => {
        this.notificationService.success('Unidade excluída com sucesso');
        this.loadOrganizations();
      },
      error: (error) => {
        const message = error?.error?.message ?? 'Erro ao excluir unidade';
        this.notificationService.error(message);
      },
    });
  }

  openManageRolesDialog(unit: OrganizationUnit) {
    const dialogData: ManageRolesDialogData = {
      organizationUnitId: unit.id,
      organizationUnitName: unit.name,
    };
    const ref = this.dialogService.open(ManageRolesDialogComponent, {
      header: 'Gerenciar Cargos — ' + unit.name,
      width: '800px',
      data: dialogData,
    });
    if (!ref) return;
    ref.onClose.subscribe(() => this.loadOrganizations());
  }

  openViewHierarchyDialog(rootOrganizationId?: string) {
    const dialogData: ViewHierarchyDialogData = { rootOrganizationId };
    this.dialogService.open(ViewHierarchyDialogComponent, {
      header: 'Hierarquia e Cargos',
      width: '900px',
      data: dialogData,
    });
  }
}
