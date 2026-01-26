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
import { OrganizationsService } from '../../../shared/api/organizations.service';
import { OrganizationRolesService } from '../../../shared/api/organization-roles.service';
import { OrganizationUnit } from '../../../shared/api/organization-unit.model';

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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>account_tree</mat-icon>
      Visualizar Hierarquia e Cargos
    </h2>

    <mat-dialog-content>
      @if (isLoading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Carregando hierarquia...</p>
        </div>
      } @else {
        <!-- Filtros -->
        <div class="filters">
          <mat-chip-listbox
            [(ngModel)]="selectedFilter"
            (change)="applyFilter()"
          >
            <mat-chip-option value="all" selected>
              <mat-icon>selectall</mat-icon>
              Todos
            </mat-chip-option>
            <mat-chip-option value="SECTOR">
              <mat-icon>domain</mat-icon>
              {{ getTypeLabel('SECTOR') }}
            </mat-chip-option>
            <mat-chip-option value="CONGREGATION">
              <mat-icon>group</mat-icon>
              {{ getTypeLabel('CONGREGATION') }}
            </mat-chip-option>
          </mat-chip-listbox>
        </div>

        <!-- Árvore hierárquica -->
        @if (filteredDataSource.data.length === 0) {
          <p class="empty-message">
            Nenhuma unidade encontrada com os filtros aplicados.
          </p>
        } @else {
          <mat-tree
            [dataSource]="filteredDataSource"
            [treeControl]="treeControl"
            class="hierarchy-tree"
          >
            <mat-tree-node *matTreeNodeDef="let node" matTreeNodeToggle>
              <li class="mat-tree-node">
                <button mat-icon-button disabled></button>
                <div class="node-content">
                  <div class="node-header">
                    <mat-icon class="type-icon">{{
                      getTypeIcon(node.unit.type)
                    }}</mat-icon>
                    <strong>{{ node.unit.name }}</strong>
                    <span class="type-badge">{{
                      getTypeLabel(node.unit.type)
                    }}</span>
                  </div>
                  @if (node.roles.length > 0) {
                    <div class="roles-list">
                      @for (role of node.roles; track $index) {
                        <div class="role-item">
                          <mat-icon>badge</mat-icon>
                          <span
                            ><strong>{{ role.roleName }}:</strong>
                            {{ role.memberName }}</span
                          >
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="no-roles">
                      <mat-icon>info_outline</mat-icon>
                      <span>Nenhum cargo atribuído</span>
                    </div>
                  }
                </div>
              </li>
            </mat-tree-node>

            <mat-nested-tree-node *matTreeNodeDef="let node; when: hasChild">
              <li>
                <div class="mat-tree-node">
                  <button
                    mat-icon-button
                    matTreeNodeToggle
                    [attr.aria-label]="'Toggle ' + node.unit.name"
                  >
                    <mat-icon class="mat-icon-rtl-mirror">
                      {{
                        treeControl.isExpanded(node)
                          ? 'expand_more'
                          : 'chevron_right'
                      }}
                    </mat-icon>
                  </button>
                  <div class="node-content">
                    <div class="node-header">
                      <mat-icon class="type-icon">{{
                        getTypeIcon(node.unit.type)
                      }}</mat-icon>
                      <strong>{{ node.unit.name }}</strong>
                      <span class="type-badge">{{
                        getTypeLabel(node.unit.type)
                      }}</span>
                      @if (node.children.length > 0) {
                        <span class="children-count"
                          >({{ node.children.length }}
                          {{
                            node.children.length === 1 ? 'filho' : 'filhos'
                          }})</span
                        >
                      }
                    </div>
                    @if (node.roles.length > 0) {
                      <div class="roles-list">
                        @for (role of node.roles; track $index) {
                          <div class="role-item">
                            <mat-icon>badge</mat-icon>
                            <span
                              ><strong>{{ role.roleName }}:</strong>
                              {{ role.memberName }}</span
                            >
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="no-roles">
                        <mat-icon>info_outline</mat-icon>
                        <span>Nenhum cargo atribuído</span>
                      </div>
                    }
                  </div>
                </div>
                <ul
                  [class.hierarchy-tree-invisible]="
                    !treeControl.isExpanded(node)
                  "
                >
                  <ng-container matTreeNodeOutlet></ng-container>
                </ul>
              </li>
            </mat-nested-tree-node>
          </mat-tree>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Fechar</button>
      <button
        mat-raised-button
        color="primary"
        (click)="exportData()"
        [disabled]="isLoading()"
      >
        <mat-icon>download</mat-icon>
        Exportar (Futuro)
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 700px;
        max-width: 900px;
        min-height: 400px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        gap: 1rem;
      }

      .filters {
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);

        mat-chip-listbox {
          display: flex;
          gap: 0.5rem;
        }

        mat-chip-option {
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            margin-right: 0.25rem;
          }
        }
      }

      .empty-message {
        text-align: center;
        color: rgba(0, 0, 0, 0.6);
        padding: 2rem;
      }

      .hierarchy-tree {
        margin-top: 1rem;

        ul,
        li {
          margin: 0;
          padding: 0;
          list-style-type: none;
        }

        .mat-tree-node {
          display: flex;
          align-items: flex-start;
          padding: 0.5rem 0;
          min-height: auto;
        }

        .node-content {
          flex: 1;
          padding: 0.75rem;
          background-color: #f5f5f5;
          border-radius: 8px;
          border-left: 4px solid #1976d2;
          margin-bottom: 0.5rem;

          .node-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;

            .type-icon {
              color: #1976d2;
            }

            .type-badge {
              background-color: #e3f2fd;
              color: #1565c0;
              padding: 0.125rem 0.5rem;
              border-radius: 12px;
              font-size: 0.75rem;
              font-weight: 500;
            }

            .children-count {
              color: rgba(0, 0, 0, 0.6);
              font-size: 0.875rem;
              margin-left: auto;
            }
          }

          .roles-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 0.75rem;
            padding-top: 0.75rem;
            border-top: 1px solid rgba(0, 0, 0, 0.08);

            .role-item {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.875rem;

              mat-icon {
                font-size: 18px;
                width: 18px;
                height: 18px;
                color: #4caf50;
              }
            }
          }

          .no-roles {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: rgba(0, 0, 0, 0.6);
            font-size: 0.875rem;
            font-style: italic;
            margin-top: 0.5rem;

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }
        }

        .hierarchy-tree-invisible {
          display: none;
        }

        ul {
          padding-left: 2rem;
        }
      }
    `,
  ],
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
