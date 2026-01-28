import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTreeModule } from '@angular/material/tree';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { firstValueFrom } from 'rxjs';
import { OrganizationsService } from '../../../../../shared/api/organizations.service';
import { OrganizationRolesService } from '../../../../../shared/api/organization-roles.service';
import { OrganizationUnit } from '../../../../../shared/api/organization-unit.model';

export interface ViewHierarchyDialogData {
  rootOrganizationId?: string;
}

interface TreeNode {
  unit: OrganizationUnit;
  roles: Array<{ memberName: string; roleName: string }>;
  children: TreeNode[];
}

type FilterType = 'all' | 'SECTOR' | 'CONGREGATION';

@Component({
  standalone: true,
  selector: 'app-view-hierarchy-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTreeModule,
    MatTooltipModule,
  ],
  templateUrl: './view-hierarchy-dialog.component.html',
  styleUrls: ['./view-hierarchy-dialog.component.scss'],

})
export class ViewHierarchyDialogComponent implements OnInit {
  private readonly dialogRef = inject(
    MatDialogRef<ViewHierarchyDialogComponent>,
  );
  readonly data = inject<ViewHierarchyDialogData>(MAT_DIALOG_DATA);
  private readonly organizationsService = inject(OrganizationsService);
  private readonly rolesService = inject(OrganizationRolesService);

  isLoading = signal(true);
  selectedFilter = signal<FilterType>('all');

  treeControl = new NestedTreeControl<TreeNode>((node) => node.children);
  dataSource = new MatTreeNestedDataSource<TreeNode>();
  filteredDataSource = new MatTreeNestedDataSource<TreeNode>();

  private allNodes: TreeNode[] = [];
  private churchUnit: OrganizationUnit | null = null;

  hasChild = (_: number, node: TreeNode) =>
    !!node.children && node.children.length > 0;

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

      // Encontrar a igreja raiz para pegar os labels customizados
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

      // Se foi passado um rootOrganizationId, filtrar a árvore para mostrar apenas essa unidade e seus filhos
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
        if (targetUnit) {
          hierarchy = [targetUnit];
        }
      }

      if (hierarchy && hierarchy.length > 0) {
        this.allNodes = await Promise.all(
          hierarchy.map((unit) => this.buildTreeNode(unit)),
        );
        this.dataSource.data = this.allNodes;
        this.applyFilter();
        this.treeControl.dataNodes = this.allNodes;
        this.treeControl.expandAll(); // Expandir tudo por padrão
      }
    } catch (error) {
      console.error('Erro ao carregar hierarquia:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async buildTreeNode(unit: OrganizationUnit): Promise<TreeNode> {
    // Buscar cargos desta unidade
    let roles: Array<{ memberName: string; roleName: string }> = [];
    try {
      const assignments = await firstValueFrom(
        this.rolesService.listRoles(unit.id),
      );
      roles = assignments.map((a) => ({
        memberName: a.userName,
        roleName: a.functionRoleName,
      }));
    } catch (error) {
      // Sem cargos atribuídos
      roles = [];
    }

    // Processar filhos recursivamente
    const children = unit.children
      ? await Promise.all(
          unit.children.map((child) => this.buildTreeNode(child)),
        )
      : [];

    return { unit, roles, children };
  }

  applyFilter(): void {
    const filter = this.selectedFilter();
    if (filter === 'all') {
      this.filteredDataSource.data = this.allNodes;
    } else {
      this.filteredDataSource.data = this.filterNodes(this.allNodes, filter);
    }
  }

  private filterNodes(nodes: TreeNode[], type: string): TreeNode[] {
    return nodes
      .map((node) => {
        const matchesFilter = node.unit.type === type;
        const filteredChildren = this.filterNodes(node.children, type);

        if (matchesFilter || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
        return null;
      })
      .filter((node): node is TreeNode => node !== null);
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      CHURCH: 'church',
      SECTOR: 'domain',
      CONGREGATION: 'group',
    };
    return icons[type] || 'location_city';
  }

  getTypeLabel(type: string): string {
    if (type === 'CHURCH') return 'Igreja';
    if (type === 'SECTOR') return this.churchUnit?.sectorLabel || 'Setor';
    if (type === 'CONGREGATION')
      return this.churchUnit?.congregationLabel || 'Congregação';
    return type;
  }

  exportData(): void {
    // TODO: Implementar exportação futura (CSV, PDF, etc.)
    alert('Funcionalidade de exportação será implementada em breve!');
  }

  close(): void {
    this.dialogRef.close();
  }
}
