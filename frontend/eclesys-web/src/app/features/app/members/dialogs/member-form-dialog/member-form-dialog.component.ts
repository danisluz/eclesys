import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
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
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { NgxMaskDirective } from 'ngx-mask';
import {
  Member,
  MemberStatus,
  Gender,
  MaritalStatus,
} from '../../../../../shared/models/member.model';
import { MembersService } from '../../../../../shared/api/members.service';
import { ChurchRolesService } from '../../../../../shared/api/church-roles.service';
import { ChurchRole } from '../../../../../shared/models/church-role.model';
import { OrganizationsService } from '../../../../../shared/api/organizations.service';
import { OrganizationUnit } from '../../../../../shared/api/organization-unit.model';
import { cpfValidator } from '../../../../../shared/validators/cpf.validator';
import { DateMaskDirective } from '../../../../../shared/directives/date-mask.directive';
import { CepLookupService } from '../../../../../shared/services/cep-lookup.service';
import { CepLookupResult } from '../../../../../shared/models/cep-lookup.models';
import { finalize, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    MatIconModule,
    MatAutocompleteModule,
    NgxMaskDirective,
    DateMaskDirective,
  ],
  templateUrl: './member-form-dialog.component.html',
  styleUrls: ['./member-form-dialog.component.scss'],
})
export class MemberFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MembersService);
  private readonly churchRolesService = inject(ChurchRolesService);
  private readonly organizationsService = inject(OrganizationsService);
  private readonly cepLookupService = inject(CepLookupService);
  private readonly dialogRef = inject(MatDialogRef<MemberFormDialogComponent>);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  saving = signal(false);
  churchRoles = signal<ChurchRole[]>([]);
  congregations = signal<OrganizationUnit[]>([]);
  rootChurch = signal<OrganizationUnit | null>(null);
  allMembers = signal<Member[]>([]);
  isCepLookupLoading = signal(false);

  spouseSearchControl = new FormControl<string | Member | null>('');
  fatherSearchControl = new FormControl<string | Member | null>('');
  motherSearchControl = new FormControl<string | Member | null>('');
  congregationSearchControl = new FormControl<string | OrganizationUnit | null>('');

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
    addressStreet: [{ value: '', disabled: true }],
    addressNumber: [''],
    addressComplement: [''],
    addressNeighborhood: [{ value: '', disabled: true }],
    addressCity: [{ value: '', disabled: true }],
    addressState: [{ value: '', disabled: true }],
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

      this.spouseSearchControl.setValue(member.family?.spouseName ?? '');
      this.fatherSearchControl.setValue(member.family?.fatherName ?? '');
      this.motherSearchControl.setValue(member.family?.motherName ?? '');
    }

    this.handleMemberSearchChanges();
  }

  private handleMemberSearchChanges() {
    this.spouseSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
      if (typeof value === 'string') {
        this.form.controls.spouseId.setValue(null);
      }
    });
    this.fatherSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
      if (typeof value === 'string') {
        this.form.controls.fatherId.setValue(null);
      }
    });
    this.motherSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (typeof value === 'string') {
          this.form.controls.motherId.setValue(null);
        }
      });

    this.congregationSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (typeof value === 'string') {
          this.form.controls.organizationUnitId.setValue('');
        }
      });
  }

  displayMember(option: Member | string | null): string {
    if (!option) return '';
    return typeof option === 'string' ? option : option.fullName;
  }

  filterMembers(search: Member | string | null): Member[] {
    const value = typeof search === 'string' ? search : search?.fullName ?? '';
    const term = value.trim().toLowerCase();

    if (term.length < 2) {
      return [];
    }

    return this.allMembers()
      .filter((member) =>
        member.fullName.toLowerCase().includes(term),
      )
      .slice(0, 20);
  }

  displayCongregation(option: OrganizationUnit | string | null): string {
    if (!option) return '';
    return typeof option === 'string' ? option : option.name;
  }

  filterCongregations(
    search: OrganizationUnit | string | null,
  ): OrganizationUnit[] {
    const value = typeof search === 'string' ? search : search?.name ?? '';
    const term = value.trim().toLowerCase();

    const source = this.congregations();

    if (term.length < 2) {
      return source.slice(0, 20);
    }

    return source
      .filter((org) => org.name.toLowerCase().includes(term))
      .slice(0, 20);
  }

  onCongregationSelected(event: MatAutocompleteSelectedEvent) {
    const org = event.option.value as OrganizationUnit;
    this.form.controls.organizationUnitId.setValue(org.id);
  }

  onSpouseSelected(event: MatAutocompleteSelectedEvent) {
    const member = event.option.value as Member;
    this.form.controls.spouseId.setValue(member.id);
  }

  onFatherSelected(event: MatAutocompleteSelectedEvent) {
    const member = event.option.value as Member;
    this.form.controls.fatherId.setValue(member.id);
  }

  onMotherSelected(event: MatAutocompleteSelectedEvent) {
    const member = event.option.value as Member;
    this.form.controls.motherId.setValue(member.id);
  }

  private applyCepResult(result: CepLookupResult) {
    if (result.street) {
      this.form.controls.addressStreet.setValue(result.street);
    }
    if (result.neighborhood) {
      this.form.controls.addressNeighborhood.setValue(result.neighborhood);
    }
    if (result.city) {
      this.form.controls.addressCity.setValue(result.city);
    }
    if (result.state) {
      this.form.controls.addressState.setValue(result.state);
    }
  }

  lookupCep() {
    const cepValue = this.form.controls.addressZipCode.value ?? '';

    if (!this.cepLookupService.isValidCep(cepValue)) {
      this.notificationService.warn('Informe um CEP válido para buscar o endereço.');
      return;
    }

    if (this.isCepLookupLoading()) return;

    this.isCepLookupLoading.set(true);

    this.cepLookupService
      .lookup(cepValue)
      .pipe(
        take(1),
        finalize(() => this.isCepLookupLoading.set(false)),
      )
      .subscribe((result) => {
        if (!result) {
          this.notificationService.warn('CEP não encontrado.');
          return;
        }

        this.applyCepResult(result);
        this.notificationService.success('Endereço preenchido com sucesso.');
      });
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

        if (this.data.mode === 'edit' && this.data.member) {
          const currentCongregation = congregations.find(
            (org) => org.id === this.data.member?.organizationUnitId,
          );
          if (currentCongregation) {
            this.congregationSearchControl.setValue(currentCongregation);
          }
        }
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

    const formValue = this.form.getRawValue();

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
      error: (error) => {
        const message =
          error?.error?.message ?? 'Não foi possível salvar o membro.';
        this.notificationService.error(message);
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
