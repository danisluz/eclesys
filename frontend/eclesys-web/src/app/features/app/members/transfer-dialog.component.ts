import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Member } from '../../../shared/models/member.model';
import { MembersService } from '../../../shared/api/members.service';
import { OrganizationsService } from '../../../shared/api/organizations.service';
import { OrganizationUnit } from '../../../shared/api/organization-unit.model';

@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Transferir Membro</h2>

    <mat-dialog-content>
      <div class="transfer-info">
        <p><strong>Membro:</strong> {{ data.member.fullName }}</p>
        <p>
          <strong>{{ getCongregationLabel() }} Atual:</strong>
          {{ data.member.organizationUnitName || 'Não definida' }}
        </p>
      </div>

      <form [formGroup]="form">
        <mat-radio-group formControlName="transferType" class="transfer-type">
          <mat-radio-button value="internal">
            Transferência Interna (dentro da organização)
          </mat-radio-button>
          <mat-radio-button value="external">
            Transferência Externa (para outra igreja)
          </mat-radio-button>
        </mat-radio-group>

        @if (form.value.transferType === 'internal') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ getCongregationLabel() }} de Destino</mat-label>
            <mat-select formControlName="toCongregationId">
              @if (loadingCongregations()) {
                <mat-option disabled>Carregando...</mat-option>
              } @else if (congregations().length === 0) {
                <mat-option disabled>
                  Nenhuma {{ getCongregationLabel() }} cadastrada. Crie
                  {{ getCongregationLabelPlural() }} primeiro em Organizações.
                </mat-option>
              } @else {
                @for (congregation of congregations(); track congregation.id) {
                  @if (congregation.id !== data.member.organizationUnitId) {
                    <mat-option [value]="congregation.id">
                      {{ congregation.name }}
                    </mat-option>
                  }
                }
              }
            </mat-select>
            @if (
              form.get('toCongregationId')?.invalid &&
              form.get('toCongregationId')?.touched
            ) {
              <mat-error
                >Selecione {{ getCongregationLabel().toLowerCase() }} de
                destino</mat-error
              >
            }
          </mat-form-field>

          @if (congregations().length === 0) {
            <div class="info-message">
              <mat-icon>info</mat-icon>
              <p>
                Você precisa cadastrar {{ getCongregationLabelPlural() }} antes
                de fazer transferências internas. Vá em
                <strong>Organizações</strong> e crie pelo menos uma
                {{ getCongregationLabel() }}.
              </p>
            </div>
          }
        }

        @if (form.value.transferType === 'external') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Destino (Igreja/Cidade)</mat-label>
            <input
              matInput
              formControlName="externalDestination"
              placeholder="Ex: Igreja Batista Central - Porto Alegre"
            />
            @if (
              form.get('externalDestination')?.invalid &&
              form.get('externalDestination')?.touched
            ) {
              <mat-error>Informe o destino da transferência</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo da Transferência</mat-label>
          <textarea
            matInput
            formControlName="reason"
            rows="3"
            placeholder="Descreva o motivo da transferência"
          ></textarea>
          @if (form.get('reason')?.invalid && form.get('reason')?.touched) {
            <mat-error>Informe o motivo da transferência</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">
        Cancelar
      </button>
      <button
        mat-flat-button
        color="primary"
        (click)="save()"
        [disabled]="form.invalid || saving()"
      >
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
          Transferindo...
        } @else {
          Confirmar Transferência
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 500px;
        padding-top: 1rem;
      }

      .transfer-info {
        background-color: rgba(0, 0, 0, 0.04);
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
      }

      .transfer-info p {
        margin: 0.25rem 0;
        font-size: 0.875rem;
      }

      .transfer-type {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .full-width {
        width: 100%;
        margin-bottom: 1rem;
      }

      .info-message {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        background-color: #e3f2fd;
        border-radius: 4px;
        border-left: 4px solid #1976d2;
        margin-bottom: 1rem;
      }

      .info-message mat-icon {
        color: #1976d2;
        flex-shrink: 0;
      }

      .info-message p {
        margin: 0;
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.87);
      }

      button mat-spinner {
        display: inline-block;
        margin-right: 0.5rem;
      }
    `,
  ],
})
export class TransferDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private membersService = inject(MembersService);
  private organizationsService = inject(OrganizationsService);

  form: FormGroup;
  congregations = signal<OrganizationUnit[]>([]);
  rootChurch = signal<OrganizationUnit | null>(null);
  loadingCongregations = signal(true);
  saving = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { member: Member },
    private dialogRef: MatDialogRef<TransferDialogComponent>,
  ) {
    this.form = this.fb.group({
      transferType: ['internal', Validators.required],
      toCongregationId: [null],
      externalDestination: [null],
      reason: ['', Validators.required],
    });

    // Atualiza validações quando o tipo de transferência muda
    this.form.get('transferType')?.valueChanges.subscribe((type) => {
      if (type === 'internal') {
        this.form.get('toCongregationId')?.setValidators([Validators.required]);
        this.form.get('externalDestination')?.clearValidators();
        this.form.get('externalDestination')?.setValue(null);
      } else {
        this.form.get('toCongregationId')?.clearValidators();
        this.form.get('toCongregationId')?.setValue(null);
        this.form
          .get('externalDestination')
          ?.setValidators([Validators.required]);
      }
      this.form.get('toCongregationId')?.updateValueAndValidity();
      this.form.get('externalDestination')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    console.log('🚀 TransferDialog ngOnInit - carregando congregações');
    this.loadCongregations();
  }

  loadCongregations() {
    console.log('📋 Iniciando carregamento de congregações');
    this.loadingCongregations.set(true);
    this.organizationsService.listAll().subscribe({
      next: (response) => {
        console.log('✅ Organizações recebidas:', response.data);

        // Busca a root church para obter os labels customizados
        const rootChurch = response.data.find((org) => org.type === 'CHURCH');
        if (rootChurch) {
          this.rootChurch.set(rootChurch);
        }

        // Função recursiva para achatar a hierarquia e pegar só congregações
        const extractCongregations = (
          orgs: OrganizationUnit[],
        ): OrganizationUnit[] => {
          let congregations: OrganizationUnit[] = [];

          for (const org of orgs) {
            // Se é congregação, adiciona
            if (org.type === 'CONGREGATION') {
              congregations.push(org);
            }
            // Se tem filhos, processa recursivamente
            if (org.children && org.children.length > 0) {
              congregations = [
                ...congregations,
                ...extractCongregations(org.children),
              ];
            }
          }

          return congregations;
        };

        const congregations = extractCongregations(response.data);
        console.log('🏛️ Congregações encontradas:', congregations);
        console.log('📊 Total de congregações:', congregations.length);

        this.congregations.set(congregations);
        this.loadingCongregations.set(false);
      },
      error: (err) => {
        console.error('❌ Erro ao carregar congregações:', err);
        this.loadingCongregations.set(false);
      },
    });
  }

  getCongregationLabel(): string {
    return this.rootChurch()?.congregationLabel ?? 'Congregação';
  }

  getCongregationLabelPlural(): string {
    const label = this.getCongregationLabel();
    // Simples pluralização: adiciona 's' ou 'ões'
    if (label.endsWith('ão')) {
      return label.slice(0, -2) + 'ões';
    }
    return label + 's';
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.form.value;

    const request = {
      toCongregationId:
        formValue.transferType === 'internal'
          ? formValue.toCongregationId
          : null,
      externalDestination:
        formValue.transferType === 'external'
          ? formValue.externalDestination
          : null,
      reason: formValue.reason,
    };

    this.membersService.transferMember(this.data.member.id, request).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
