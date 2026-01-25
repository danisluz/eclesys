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
import { MatRadioModule } from '@angular/material/radio';
import {
  Member,
  MemberStatus,
  Gender,
  MaritalStatus,
} from '../../../shared/models/member.model';
import { MembersService } from '../../../shared/api/members.service';
import { ChurchRolesService } from '../../../shared/api/church-roles.service';
import { ChurchRole } from '../../../shared/models/church-role.model';
import { OrganizationsService } from '../../../shared/api/organizations.service';
import { OrganizationUnit } from '../../../shared/api/organization-unit.model';

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
    MatRadioModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Novo Membro' : 'Editar Membro' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <!-- Dados Básicos -->
        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nome Completo *</mat-label>
            <input matInput formControlName="fullName" />
            @if (form.controls.fullName.hasError('required')) {
              <mat-error>Nome é obrigatório</mat-error>
            }
            @if (form.controls.fullName.hasError('maxlength')) {
              <mat-error>Máximo 180 caracteres</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Congregação *</mat-label>
            <mat-select formControlName="organizationUnitId">
              @if (congregations().length === 0) {
                <mat-option disabled
                  >Nenhuma congregação cadastrada. Cadastre em
                  Organizações.</mat-option
                >
              }
              @for (org of congregations(); track org.id) {
                <mat-option [value]="org.id">{{ org.name }}</mat-option>
              }
            </mat-select>
            @if (form.controls.organizationUnitId.hasError('required')) {
              <mat-error>Congregação é obrigatória</mat-error>
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

        <!-- Informações Pessoais -->
        <div class="form-row two-cols">
          <div>
            <label class="form-label">Sexo</label>
            <mat-radio-group formControlName="gender" class="radio-group">
              <mat-radio-button value="M">Masculino</mat-radio-button>
              <mat-radio-button value="F">Feminino</mat-radio-button>
            </mat-radio-group>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Estado Civil</mat-label>
            <mat-select formControlName="maritalStatus">
              <mat-option [value]="null">Não informado</mat-option>
              <mat-option value="SINGLE">Solteiro(a)</mat-option>
              <mat-option value="MARRIED">Casado(a)</mat-option>
              <mat-option value="WIDOWED">Viúvo(a)</mat-option>
              <mat-option value="DIVORCED">Divorciado(a)</mat-option>
              <mat-option value="SEPARATED">Separado(a)</mat-option>
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

        <!-- Endereço -->
        <h3 class="section-title">Endereço</h3>
        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Rua/Avenida</mat-label>
            <input matInput formControlName="addressStreet" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Número</mat-label>
            <input matInput formControlName="addressNumber" />
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Complemento</mat-label>
            <input matInput formControlName="addressComplement" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Bairro</mat-label>
            <input matInput formControlName="addressNeighborhood" />
          </mat-form-field>
        </div>

        <div class="form-row three-cols">
          <mat-form-field appearance="outline">
            <mat-label>Cidade</mat-label>
            <input matInput formControlName="addressCity" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <input matInput formControlName="addressState" maxlength="2" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>CEP</mat-label>
            <input matInput formControlName="addressZipCode" />
          </mat-form-field>
        </div>

        <!-- Família -->
        <h3 class="section-title">Família</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Cônjuge</mat-label>
            <mat-select formControlName="spouseId">
              <mat-option [value]="null">Nenhum</mat-option>
              @for (member of allMembers(); track member.id) {
                <mat-option [value]="member.id">{{
                  member.fullName
                }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Pai</mat-label>
            <mat-select formControlName="fatherId">
              <mat-option [value]="null">Nenhum</mat-option>
              @for (member of allMembers(); track member.id) {
                <mat-option [value]="member.id">{{
                  member.fullName
                }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mãe</mat-label>
            <mat-select formControlName="motherId">
              <mat-option [value]="null">Nenhum</mat-option>
              @for (member of allMembers(); track member.id) {
                <mat-option [value]="member.id">{{
                  member.fullName
                }}</mat-option>
              }
            </mat-select>
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
      .three-cols {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 1rem;
      }
      .w-full {
        width: 100%;
      }
      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: rgba(0, 0, 0, 0.87);
      }
      .radio-group {
        display: flex;
        gap: 1.5rem;
      }
      .section-title {
        font-size: 1rem;
        font-weight: 500;
        margin: 1.5rem 0 1rem;
        color: rgba(0, 0, 0, 0.87);
      }
    `,
  ],
})
export class MemberFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(MembersService);
  private churchRolesService = inject(ChurchRolesService);
  private organizationsService = inject(OrganizationsService);
  private dialogRef = inject(MatDialogRef<MemberFormDialogComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  saving = signal(false);
  churchRoles = signal<ChurchRole[]>([]);
  congregations = signal<OrganizationUnit[]>([]);
  allMembers = signal<Member[]>([]);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(180)]],
    organizationUnitId: ['', [Validators.required]],
    email: ['', [Validators.email]],
    phone: [''],
    document: [''],
    gender: [null as Gender | null],
    maritalStatus: [null as MaritalStatus | null],
    birthDate: [null as Date | null],
    baptismDate: [null as Date | null],
    churchRoleId: [null as string | null],
    addressStreet: [''],
    addressNumber: [''],
    addressComplement: [''],
    addressNeighborhood: [''],
    addressCity: [''],
    addressState: [''],
    addressZipCode: [''],
    spouseId: [null as string | null],
    fatherId: [null as string | null],
    motherId: [null as string | null],
    status: ['ACTIVE' as MemberStatus],
  });

  ngOnInit() {
    this.loadChurchRoles();
    this.loadCongregations();
    this.loadAllMembers();

    if (this.data.mode === 'edit' && this.data.member) {
      const member = this.data.member;
      this.form.patchValue({
        fullName: member.fullName,
        organizationUnitId: member.organizationUnitId || '',
        email: member.email,
        phone: member.phone,
        document: member.document,
        gender: member.gender,
        maritalStatus: member.maritalStatus,
        birthDate: member.birthDate ? new Date(member.birthDate) : null,
        baptismDate: member.baptismDate ? new Date(member.baptismDate) : null,
        churchRoleId: member.churchRoleId,
        addressStreet: member.address?.street || '',
        addressNumber: member.address?.number || '',
        addressComplement: member.address?.complement || '',
        addressNeighborhood: member.address?.neighborhood || '',
        addressCity: member.address?.city || '',
        addressState: member.address?.state || '',
        addressZipCode: member.address?.zipCode || '',
        spouseId: member.family?.spouseId,
        fatherId: member.family?.fatherId,
        motherId: member.family?.motherId,
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

  loadCongregations() {
    this.organizationsService.listAll().subscribe({
      next: (response) => {
        const allOrgs = response.data || [];
        console.log('[DEBUG] Estrutura hierárquica recebida:', allOrgs);

        // Achatar a estrutura hierárquica recursivamente
        const flattenOrganizations = (
          orgs: OrganizationUnit[],
        ): OrganizationUnit[] => {
          const result: OrganizationUnit[] = [];
          for (const org of orgs) {
            result.push(org);
            if (org.children && org.children.length > 0) {
              result.push(...flattenOrganizations(org.children));
            }
          }
          return result;
        };

        const flatOrgs = flattenOrganizations(allOrgs);
        console.log(
          '[DEBUG] Total de organizações achatadas:',
          flatOrgs.length,
        );

        // Filtra apenas congregações ativas
        const congregations = flatOrgs.filter(
          (org) => org.type === 'CONGREGATION' && org.status === 'ACTIVE',
        );
        console.log('[DEBUG] Congregações filtradas:', congregations);
        this.congregations.set(congregations);
      },
      error: (err) => {
        console.error('[MemberForm] Error loading organizations:', err);
        this.congregations.set([]);
      },
    });
  }

  loadAllMembers() {
    this.service.listAll().subscribe({
      next: (response) => {
        const currentMemberId = this.data.member?.id;
        const members = currentMemberId
          ? response.data.filter((m) => m.id !== currentMemberId)
          : response.data;
        this.allMembers.set(members);
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

    const address =
      formValue.addressStreet ||
      formValue.addressNumber ||
      formValue.addressCity
        ? {
            street: formValue.addressStreet || null,
            number: formValue.addressNumber || null,
            complement: formValue.addressComplement || null,
            neighborhood: formValue.addressNeighborhood || null,
            city: formValue.addressCity || null,
            state: formValue.addressState || null,
            zipCode: formValue.addressZipCode || null,
          }
        : null;

    const request = {
      fullName: formValue.fullName!,
      organizationUnitId: formValue.organizationUnitId!,
      email: formValue.email || null,
      phone: formValue.phone || null,
      document: formValue.document || null,
      gender: formValue.gender || null,
      maritalStatus: formValue.maritalStatus || null,
      birthDate: formValue.birthDate
        ? formValue.birthDate.toISOString().split('T')[0]
        : null,
      baptismDate: formValue.baptismDate
        ? formValue.baptismDate.toISOString().split('T')[0]
        : null,
      address,
      churchRoleId: formValue.churchRoleId || null,
      spouseId: formValue.spouseId || null,
      fatherId: formValue.fatherId || null,
      motherId: formValue.motherId || null,
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
