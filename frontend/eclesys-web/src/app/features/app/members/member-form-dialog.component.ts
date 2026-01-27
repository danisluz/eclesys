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
import { NgxMaskDirective } from 'ngx-mask';
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
import { cpfValidator } from '../../../shared/validators/cpf.validator';

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
    NgxMaskDirective,
  ],
  templateUrl: './member-form-dialog.component.html',
  styleUrls: ['./member-form-dialog.component.scss'],

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
  rootChurch = signal<OrganizationUnit | null>(null);
  allMembers = signal<Member[]>([]);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(180)]],
    organizationUnitId: ['', [Validators.required]],
    email: ['', [Validators.email]],
    phone: [''],
    document: ['', [Validators.required, cpfValidator()]],
    gender: [null as Gender | null],
    maritalStatus: [null as MaritalStatus | null],
    birthDate: [null as Date | null],
    baptismDate: [null as Date | null],
    baptismChurch: [''],
    baptismLocation: [''],
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
        baptismChurch: member.baptismChurch || '',
        baptismLocation: member.baptismLocation || '',
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

        // Busca a root church para obter os labels customizados
        const rootChurch = allOrgs.find((org) => org.type === 'CHURCH');
        if (rootChurch) {
          this.rootChurch.set(rootChurch);
        }

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
    this.service
      .listAll(undefined, undefined, undefined, undefined, 0, 1000)
      .subscribe({
        next: (response) => {
          const currentMemberId = this.data.member?.id;
          const members = currentMemberId
            ? response.data.content.filter(
                (m: Member) => m.id !== currentMemberId,
              )
            : response.data.content;
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
      baptismChurch: formValue.baptismChurch || null,
      baptismLocation: formValue.baptismLocation || null,
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

  getCongregationLabel(): string {
    return this.rootChurch()?.congregationLabel ?? 'Congregação';
  }

  getCongregationLabelPlural(): string {
    const label = this.getCongregationLabel();
    if (label.endsWith('ão')) {
      return label.slice(0, -2) + 'ões';
    }
    return label + 's';
  }
}
