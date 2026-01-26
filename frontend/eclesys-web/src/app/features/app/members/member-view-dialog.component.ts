import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Member, MemberTransfer } from '../../../shared/models/member.model';
import { MembersService } from '../../../shared/api/members.service';
import { OrganizationsService } from '../../../shared/api/organizations.service';
import { OrganizationUnit } from '../../../shared/api/organization-unit.model';

@Component({
  selector: 'app-member-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>{{ data.member.fullName }}</h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <mat-tab-group>
        <!-- Dados Pessoais -->
        <mat-tab label="Dados Pessoais">
          <div class="tab-content">
            <div class="info-section">
              <h3>Informações Básicas</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>Nome Completo</label>
                  <p>{{ data.member.fullName }}</p>
                </div>

                @if (data.member.email) {
                  <div class="info-item">
                    <label>E-mail</label>
                    <p>{{ data.member.email }}</p>
                  </div>
                }

                @if (data.member.phone) {
                  <div class="info-item">
                    <label>Telefone</label>
                    <p>{{ data.member.phone }}</p>
                  </div>
                }

                @if (data.member.document) {
                  <div class="info-item">
                    <label>CPF</label>
                    <p>{{ data.member.document }}</p>
                  </div>
                }

                @if (data.member.birthDate) {
                  <div class="info-item">
                    <label>Data de Nascimento</label>
                    <p>{{ formatDate(data.member.birthDate) }}</p>
                  </div>
                }

                @if (data.member.gender) {
                  <div class="info-item">
                    <label>Gênero</label>
                    <p>{{ formatGender(data.member.gender) }}</p>
                  </div>
                }

                @if (data.member.maritalStatus) {
                  <div class="info-item">
                    <label>Estado Civil</label>
                    <p>{{ formatMaritalStatus(data.member.maritalStatus) }}</p>
                  </div>
                }

                <div class="info-item">
                  <label>Status</label>
                  <mat-chip-set>
                    <mat-chip
                      [class]="'status-' + data.member.status.toLowerCase()"
                    >
                      {{ getStatusLabel(data.member.status) }}
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="info-section">
              <h3>Informações Eclesiásticas</h3>
              <div class="info-grid">
                @if (data.member.organizationUnitName) {
                  <div class="info-item">
                    <label>{{ getCongregationLabel() }}</label>
                    <p>{{ data.member.organizationUnitName }}</p>
                  </div>
                }

                @if (data.member.churchRoleName) {
                  <div class="info-item">
                    <label>Cargo/Função</label>
                    <p>{{ data.member.churchRoleName }}</p>
                  </div>
                }

                @if (data.member.baptismDate) {
                  <div class="info-item">
                    <label>Data de Batismo</label>
                    <p>{{ formatDate(data.member.baptismDate) }}</p>
                  </div>
                }
              </div>
            </div>

            @if (data.member.address) {
              <mat-divider></mat-divider>

              <div class="info-section">
                <h3>Endereço</h3>
                <div class="info-grid">
                  @if (data.member.address.street) {
                    <div class="info-item">
                      <label>Rua</label>
                      <p>
                        {{ data.member.address.street }}
                        @if (data.member.address.number) {
                          , {{ data.member.address.number }}
                        }
                      </p>
                    </div>
                  }

                  @if (data.member.address.complement) {
                    <div class="info-item">
                      <label>Complemento</label>
                      <p>{{ data.member.address.complement }}</p>
                    </div>
                  }

                  @if (data.member.address.neighborhood) {
                    <div class="info-item">
                      <label>Bairro</label>
                      <p>{{ data.member.address.neighborhood }}</p>
                    </div>
                  }

                  @if (data.member.address.city) {
                    <div class="info-item">
                      <label>Cidade</label>
                      <p>
                        {{ data.member.address.city }}
                        @if (data.member.address.state) {
                          - {{ data.member.address.state }}
                        }
                      </p>
                    </div>
                  }

                  @if (data.member.address.zipCode) {
                    <div class="info-item">
                      <label>CEP</label>
                      <p>{{ data.member.address.zipCode }}</p>
                    </div>
                  }
                </div>
              </div>
            }

            @if (data.member.family) {
              <mat-divider></mat-divider>

              <div class="info-section">
                <h3>Relacionamentos Familiares</h3>
                <div class="info-grid">
                  @if (data.member.family.spouseName) {
                    <div class="info-item">
                      <label>Cônjuge</label>
                      <p>{{ data.member.family.spouseName }}</p>
                    </div>
                  }

                  @if (data.member.family.fatherName) {
                    <div class="info-item">
                      <label>Pai</label>
                      <p>{{ data.member.family.fatherName }}</p>
                    </div>
                  }

                  @if (data.member.family.motherName) {
                    <div class="info-item">
                      <label>Mãe</label>
                      <p>{{ data.member.family.motherName }}</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </mat-tab>

        <!-- Histórico de Transferências -->
        <mat-tab label="Histórico de Transferências">
          <div class="tab-content">
            @if (loadingTransfers()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Carregando histórico...</p>
              </div>
            } @else if (transfers().length === 0) {
              <div class="empty-state">
                <mat-icon>history</mat-icon>
                <p>Nenhuma transferência registrada</p>
              </div>
            } @else {
              <table
                mat-table
                [dataSource]="transfers()"
                class="transfers-table"
              >
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Data</th>
                  <td mat-cell *matCellDef="let transfer">
                    <span class="transfer-date">{{
                      formatDateTime(transfer.createdAt)
                    }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="from">
                  <th mat-header-cell *matHeaderCellDef>De</th>
                  <td mat-cell *matCellDef="let transfer">
                    <span class="text-secondary">{{
                      transfer.fromCongregationName || 'N/A'
                    }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="to">
                  <th mat-header-cell *matHeaderCellDef>Para</th>
                  <td mat-cell *matCellDef="let transfer">
                    @if (transfer.toCongregationName) {
                      <span class="text-secondary">{{
                        transfer.toCongregationName
                      }}</span>
                    } @else {
                      <span class="external-transfer"
                        >Transferência Externa</span
                      >
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="reason">
                  <th mat-header-cell *matHeaderCellDef>Motivo</th>
                  <td mat-cell *matCellDef="let transfer">
                    <span class="text-secondary">{{
                      transfer.reason || '—'
                    }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let transfer">
                    @if (transfer.status) {
                      <mat-chip-set>
                        <mat-chip
                          [class]="'status-' + transfer.status.toLowerCase()"
                        >
                          {{ getStatusLabel(transfer.status) }}
                        </mat-chip>
                      </mat-chip-set>
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="processedBy">
                  <th mat-header-cell *matHeaderCellDef>Processado por</th>
                  <td mat-cell *matCellDef="let transfer">
                    <div class="user-info-cell">
                      @if (transfer.approvedByUserName) {
                        <span class="text-secondary">{{
                          transfer.approvedByUserName
                        }}</span>
                      } @else if (transfer.requestedByUserName) {
                        <span class="text-secondary">{{
                          transfer.requestedByUserName
                        }}</span>
                      } @else {
                        <span class="text-secondary">—</span>
                      }
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
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem 0;
      }

      h2 {
        margin: 0;
      }

      mat-dialog-content {
        padding: 0;
        overflow: hidden;
      }

      .tab-content {
        padding: 1.5rem;
        min-height: 400px;
        max-height: 500px;
        overflow-y: auto;
      }

      .info-section {
        margin-bottom: 1.5rem;
      }

      .info-section h3 {
        margin: 0 0 1rem;
        color: rgba(0, 0, 0, 0.87);
        font-size: 1rem;
        font-weight: 500;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.25rem;
      }

      .info-item label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.6);
        text-transform: uppercase;
        margin-bottom: 0.25rem;
      }

      .info-item p {
        margin: 0;
        color: rgba(0, 0, 0, 0.87);
        font-size: 0.875rem;
      }

      mat-divider {
        margin: 1.5rem 0;
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

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        gap: 1rem;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        gap: 1rem;
        color: rgba(0, 0, 0, 0.38);
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      .transfers-table {
        width: 100%;
      }

      .transfers-table th {
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
        background-color: #fafafa;
        padding: 1rem 1.5rem;
      }

      .transfers-table td {
        padding: 1rem 1.5rem;
      }

      .table-row {
        transition: background-color 0.2s;
      }

      .table-row:hover {
        background-color: #f5f5f5;
      }

      .transfer-date {
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
        font-size: 0.875rem;
      }

      .text-secondary {
        color: rgba(0, 0, 0, 0.6);
        font-size: 0.9375rem;
      }

      .external-transfer {
        color: #1565c0;
        font-style: italic;
        font-size: 0.9375rem;
      }

      .user-info-cell {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .status-pending {
        background-color: #fff3e0 !important;
        color: #e65100 !important;
      }

      .status-approved {
        background-color: #e8f5e9 !important;
        color: #2e7d32 !important;
      }

      .status-rejected {
        background-color: #ffebee !important;
        color: #c62828 !important;
      }

      .status-cancelled {
        background-color: #f5f5f5 !important;
        color: #616161 !important;
      }

      .status-chip.status-cancelled {
        background-color: #e2e3e5;
        color: #383d41;
      }

      .transfer-body {
        padding: 1rem;
      }

      .transfer-route {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .route-point {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
      }

      .route-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.6);
        text-transform: uppercase;
      }

      .route-value {
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.87);
        font-weight: 500;
      }

      .route-arrow {
        color: rgba(0, 0, 0, 0.38);
        flex-shrink: 0;
      }

      .external-transfer {
        color: #1565c0;
        font-style: italic;
      }

      .transfer-reason {
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.87);
        background-color: rgba(0, 0, 0, 0.04);
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 0.75rem;
      }

      .rejection-reason {
        font-size: 0.875rem;
        color: #721c24;
        background-color: #f8d7da;
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 0.75rem;
        border: 1px solid #f5c6cb;
      }

      .transfer-footer {
        display: flex;
        justify-content: flex-end;
      }

      .transfer-users {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 100%;
      }

      .user-info {
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.6);
      }

      .transferred-by {
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.6);
      }
    `,
  ],
})
export class MemberViewDialogComponent implements OnInit {
  private service = inject(MembersService);
  private organizationsService = inject(OrganizationsService);

  transfers = signal<MemberTransfer[]>([]);
  loadingTransfers = signal(true);
  rootChurch = signal<OrganizationUnit | null>(null);

  displayedColumns = ['date', 'from', 'to', 'reason', 'status', 'processedBy'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { member: Member },
    private dialogRef: MatDialogRef<MemberViewDialogComponent>,
  ) {
    console.log(
      '🏗️ MemberViewDialogComponent construído com membro:',
      data.member,
    );
  }

  ngOnInit() {
    console.log('🚀 ngOnInit executado, carregando histórico...');
    this.loadRootChurch();
    this.loadTransferHistory();
  }

  loadRootChurch() {
    this.organizationsService.listAll().subscribe({
      next: (response) => {
        const rootChurch = response.data.find((org) => org.type === 'CHURCH');
        if (rootChurch) {
          this.rootChurch.set(rootChurch);
        }
      },
      error: (err) => {
        console.error('❌ Erro ao carregar organizações:', err);
      },
    });
  }

  loadTransferHistory() {
    this.loadingTransfers.set(true);
    console.log('🔍 Carregando histórico para membro:', this.data.member.id);
    this.service.getMemberTransferHistory(this.data.member.id).subscribe({
      next: (response) => {
        console.log('✅ Histórico recebido:', response);
        console.log('📊 Total de transferências:', response.data?.length);
        console.log('📋 Transferências:', response.data);
        this.transfers.set(response.data);
        console.log('✔️ Signal atualizado, valor atual:', this.transfers());
        this.loadingTransfers.set(false);
      },
      error: (err) => {
        console.error('❌ Erro ao carregar histórico:', err);
        this.loadingTransfers.set(false);
      },
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatGender(gender: string): string {
    return gender === 'M' ? 'Masculino' : 'Feminino';
  }

  formatMaritalStatus(status: string): string {
    const labels: Record<string, string> = {
      SINGLE: 'Solteiro(a)',
      MARRIED: 'Casado(a)',
      WIDOWED: 'Viúvo(a)',
      DIVORCED: 'Divorciado(a)',
      SEPARATED: 'Separado(a)',
    };
    return labels[status] || status;
  }

  getStatusLabel(status: string): string {
    // Labels para status de membro
    const memberStatusLabels: Record<string, string> = {
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      TRANSFERRED: 'Transferido',
      DECEASED: 'Falecido',
    };

    // Labels para status de transferência
    const transferStatusLabels: Record<string, string> = {
      PENDING: 'Pendente',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      CANCELLED: 'Cancelada',
    };

    return transferStatusLabels[status] || memberStatusLabels[status] || status;
  }
  getCongregationLabel(): string {
    return this.rootChurch()?.congregationLabel ?? 'Congregação';
  }
}
