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
import { Member, MemberTransfer } from '../../../shared/models/member.model';
import { MembersService } from '../../../shared/api/members.service';

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
                    <label>Congregação</label>
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
              <div class="transfers-list">
                @for (transfer of transfers(); track transfer.id) {
                  <div class="transfer-card">
                    <div class="transfer-header">
                      <mat-icon>swap_horiz</mat-icon>
                      <span class="transfer-date">{{
                        formatDateTime(transfer.createdAt)
                      }}</span>
                    </div>

                    <div class="transfer-body">
                      <div class="transfer-route">
                        <div class="route-point">
                          <span class="route-label">De:</span>
                          <span class="route-value">{{
                            transfer.fromCongregationName || 'N/A'
                          }}</span>
                        </div>
                        <mat-icon class="route-arrow">arrow_forward</mat-icon>
                        <div class="route-point">
                          <span class="route-label">Para:</span>
                          <span class="route-value">
                            @if (transfer.toCongregationName) {
                              {{ transfer.toCongregationName }}
                            } @else {
                              <span class="external-transfer">
                                Transferência Externa
                              </span>
                            }
                          </span>
                        </div>
                      </div>

                      @if (transfer.reason) {
                        <div class="transfer-reason">
                          <strong>Motivo:</strong>
                          {{ transfer.reason }}
                        </div>
                      }

                      <div class="transfer-footer">
                        <span class="transferred-by"
                          >Por: {{ transfer.transferredByUserName }}</span
                        >
                      </div>
                    </div>
                  </div>
                }
              </div>
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

      .transfers-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .transfer-card {
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 8px;
        overflow: hidden;
      }

      .transfer-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background-color: rgba(0, 0, 0, 0.04);
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }

      .transfer-header mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: rgba(0, 0, 0, 0.6);
      }

      .transfer-date {
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.6);
        font-weight: 500;
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

      .transfer-footer {
        display: flex;
        justify-content: flex-end;
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

  transfers = signal<MemberTransfer[]>([]);
  loadingTransfers = signal(true);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { member: Member },
    private dialogRef: MatDialogRef<MemberViewDialogComponent>,
  ) {}

  ngOnInit() {
    this.loadTransferHistory();
  }

  loadTransferHistory() {
    this.loadingTransfers.set(true);
    this.service.getMemberTransferHistory(this.data.member.id).subscribe({
      next: (response) => {
        this.transfers.set(response.data);
        this.loadingTransfers.set(false);
      },
      error: () => {
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
    const labels: Record<string, string> = {
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      TRANSFERRED: 'Transferido',
      DECEASED: 'Falecido',
    };
    return labels[status] || status;
  }
}
