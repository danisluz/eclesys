import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Member, MemberStatus } from '../../../shared/models/member.model';
import { MembersService } from '../../../shared/api/members.service';
import { ChurchRolesService } from '../../../shared/api/church-roles.service';
import { ChurchRole } from '../../../shared/models/church-role.model';

interface DialogData {
  mode: 'create' | 'edit';
  member?: Member;
}

@Component({
  selector: 'app-member-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Novo Membro' : 'Editar Membro' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nome Completo</mat-label>
            <input matInput formControlName="fullName" />
            @if (form.controls.fullName.hasError('required')) {
              <mat-error>Nome é obrigatório</mat-error>
            }
            @if (form.controls.fullName.hasError('maxlength')) {
              <mat-error>Máximo 180 caracteres</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
            @if (form.controls.email.hasError('email')) {
              <mat-error>Email inválido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Telefone</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>CPF/Documento</mat-label>
            <input matInput formControlName="document" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cargo Eclesiástico</mat-label>
            <mat-select formControlName="churchRoleId">
              <mat-option [value]="null">Nenhum</mat-option>
              @for (role of churchRoles(); track role.id) {
                <mat-option [value]="role.id">{{ role.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Data de Nascimento</mat-label>
            <input
              matInput
              [matDatepicker]="birthPicker"
              formControlName="birthDate"
            />
            <mat-datepicker-toggle
              matSuffix
              [for]="birthPicker"
            ></mat-datepicker-toggle>
            <mat-datepicker #birthPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Data de Batismo</mat-label>
            <input
              matInput
              [matDatepicker]="baptismPicker"
              formControlName="baptismDate"
            />
            <mat-datepicker-toggle
              matSuffix
              [for]="baptismPicker"
            ></mat-datepicker-toggle>
            <mat-datepicker #baptismPicker></mat-datepicker>
          </mat-form-field>
        </div>

        @if (data.mode === 'edit') {
          <div class="form-row">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="ACTIVE">Ativo</mat-option>
                <mat-option value="INACTIVE">Inativo</mat-option>
                <mat-option value="TRANSFERRED">Transferido</mat-option>
                <mat-option value="DECEASED">Falecido</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || saving()"
        (click)="save()"
      >
        {{ saving() ? 'Salvando...' : 'Salvar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        max-height: 70vh;
        overflow-y: auto;
      }
      .form-row {
        margin-bottom: 1rem;
      }
      .two-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .w-full {
        width: 100%;
      }
    `,
  ],
})
export class MemberFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(MembersService);
  private churchRolesService = inject(ChurchRolesService);
  private dialogRef = inject(MatDialogRef<MemberFormDialogComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  saving = signal(false);
  churchRoles = signal<ChurchRole[]>([]);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(180)]],
    email: ['', [Validators.email]],
    phone: [''],
    document: [''],
    birthDate: [null as Date | null],
    baptismDate: [null as Date | null],
    churchRoleId: [null as string | null],
    status: ['ACTIVE' as MemberStatus],
  });

  ngOnInit() {
    this.loadChurchRoles();

    if (this.data.mode === 'edit' && this.data.member) {
      const member = this.data.member;
      this.form.patchValue({
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        document: member.document,
        birthDate: member.birthDate ? new Date(member.birthDate) : null,
        baptismDate: member.baptismDate ? new Date(member.baptismDate) : null,
        churchRoleId: member.churchRoleId,
        status: member.status,
      });
    }
  }

  loadChurchRoles() {
    this.churchRolesService.listAll(true).subscribe({
      next: (response) => {
        this.churchRoles.set(response.data);
      },
    });
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) return;

    this.saving.set(true);

    const formValue = this.form.value;
    const request = {
      fullName: formValue.fullName!,
      email: formValue.email || null,
      phone: formValue.phone || null,
      document: formValue.document || null,
      birthDate: formValue.birthDate
        ? formValue.birthDate.toISOString().split('T')[0]
        : null,
      baptismDate: formValue.baptismDate
        ? formValue.baptismDate.toISOString().split('T')[0]
        : null,
      churchRoleId: formValue.churchRoleId || null,
      ...(this.data.mode === 'edit' && { status: formValue.status }),
    };

    const operation =
      this.data.mode === 'create'
        ? this.service.create(request as any)
        : this.service.update(this.data.member!.id, request as any);

    operation.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
