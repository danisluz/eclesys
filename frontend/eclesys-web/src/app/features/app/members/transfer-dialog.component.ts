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
  ],
  template: `
    <h2 mat-dialog-title>Transferir Membro</h2>

    <mat-dialog-content>
      <div class="transfer-info">
        <p><strong>Membro:</strong> {{ data.member.fullName }}</p>
        <p>
          <strong>Congregação Atual:</strong>
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
            <mat-label>Congregação de Destino</mat-label>
            <mat-select formControlName="toCongregationId">
              @if (loadingCongregations()) {
                <mat-option disabled>Carregando...</mat-option>
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
              <mat-error>Selecione a congregação de destino</mat-error>
            }
          </mat-form-field>
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
    this.loadCongregations();
  }

  loadCongregations() {
    this.loadingCongregations.set(true);
    this.organizationsService.listAll().subscribe({
      next: (response) => {
        this.congregations.set(response.data);
        this.loadingCongregations.set(false);
      },
      error: () => {
        this.loadingCongregations.set(false);
      },
    });
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
