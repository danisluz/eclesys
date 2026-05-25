import { Component, inject, signal, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TreeModule } from 'primeng/tree';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import type { TreeNode as UITreeNode } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { OrganizationsService } from '../../../../../shared/api/organizations.service';
import { OrganizationRolesService } from '../../../../../shared/api/organization-roles.service';
import { OrganizationUnit } from '../../../../../shared/api/organization-unit.model';

export interface ViewHierarchyDialogData {
  rootOrganizationId?: string;
}

type FilterType = 'all' | 'SECTOR' | 'CONGREGATION';

interface HierarchyNodeData {
  unit: OrganizationUnit;
  roles: Array<{ memberName: string; roleName: string }>;
}

@Component({
  standalone: true,
  selector: 'app-view-hierarchy-dialog',
  imports: [
    FormsModule,
    TreeModule,
    ButtonModule,
    ProgressSpinnerModule,
    SelectButtonModule,
  ],
  templateUrl: './view-hierarchy-dialog.component.html',
  styleUrls: ['./view-hierarchy-dialog.component.scss'],
})
export class ViewHierarchyDialogComponent implements OnInit {
  private readonly ref = inject(DynamicDialogRef);
  readonly data = inject(DynamicDialogConfig).data as ViewHierarchyDialogData;
  private readonly organizationsService = inject(OrganizationsService);
  private readonly rolesService = inject(OrganizationRolesService);

  isLoading = signal(true);
  selectedFilter: FilterType = 'all';

  allTreeNodes: UITreeNode<HierarchyNodeData>[] = [];
  filteredTreeNodes: UITreeNode<HierarchyNodeData>[] = [];

  private churchUnit: OrganizationUnit | null = null;

  filterOptions: { label: string; value: FilterType }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Setores', value: 'SECTOR' },
    { label: 'Congregações', value: 'CONGREGATION' },
  ];

  ngOnInit(): void {
    this.loadHierarchy();
  }

  private async loadHierarchy(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.organizationsService.listAll(),
      );
      let hierarchy = response?.data || [];

      const findChurch = (
        units: OrganizationUnit[],
      ): OrganizationUnit | null => {
        for (const unit of units) {
          if (unit.type === 'CHURCH') return unit;
          if (unit.children) {
            const found = findChurch(unit.children);
            if (found) return found;
          }
        }
        return null;
      };
      this.churchUnit = findChurch(hierarchy);

      if (this.data.rootOrganizationId) {
        const findUnitById = (
          units: OrganizationUnit[],
          id: string,
        ): OrganizationUnit | null => {
          for (const unit of units) {
            if (unit.id === id) return unit;
            if (unit.children) {
              const found = findUnitById(unit.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        const targetUnit = findUnitById(
          hierarchy,
          this.data.rootOrganizationId,
        );
        if (targetUnit) hierarchy = [targetUnit];
      }

      if (hierarchy.length > 0) {
        this.allTreeNodes = await Promise.all(
          hierarchy.map((u) => this.buildTreeNode(u)),
        );
        this.applyFilter();
      }
    } catch (error) {
      console.error('Erro ao carregar hierarquia:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async buildTreeNode(
    unit: OrganizationUnit,
  ): Promise<UITreeNode<HierarchyNodeData>> {
    let roles: Array<{ memberName: string; roleName: string }> = [];
    try {
      const assignments = await firstValueFrom(
        this.rolesService.listRoles(unit.id),
      );
      roles = assignments.map((a) => ({
        memberName: a.userName,
        roleName: a.functionRoleName,
      }));
    } catch {
      roles = [];
    }

    const children = unit.children
      ? await Promise.all(
          unit.children.map((child) => this.buildTreeNode(child)),
        )
      : [];

    return {
      label: unit.name,
      data: { unit, roles },
      children,
      expanded: true,
      icon: this.getTypeIcon(unit.type),
    };
  }

  applyFilter(): void {
    if (this.selectedFilter === 'all') {
      this.filteredTreeNodes = this.allTreeNodes;
    } else {
      this.filteredTreeNodes = this.filterNodes(
        this.allTreeNodes,
        this.selectedFilter,
      );
    }
  }

  private filterNodes(
    nodes: UITreeNode<HierarchyNodeData>[],
    type: string,
  ): UITreeNode<HierarchyNodeData>[] {
    return nodes.reduce<UITreeNode<HierarchyNodeData>[]>((acc, node) => {
      const matches = node.data?.unit.type === type;
      const filteredChildren = this.filterNodes(node.children ?? [], type);

      if (matches || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }

      return acc;
    }, []);
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      CHURCH: 'pi pi-home',
      SECTOR: 'pi pi-building',
      CONGREGATION: 'pi pi-users',
    };
    return icons[type] || 'pi pi-map-marker';
  }

  getTypeLabel(type: string): string {
    if (type === 'CHURCH') return 'Igreja';
    if (type === 'SECTOR') return this.churchUnit?.sectorLabel || 'Setor';
    if (type === 'CONGREGATION')
      return this.churchUnit?.congregationLabel || 'Congregação';
    return type;
  }

  close(): void {
    this.ref.close();
  }
}
