import { Component, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
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
import { CepLookupService } from '../../../../../shared/services/cep-lookup.service';
import { CepLookupResult } from '../../../../../shared/models/cep-lookup.models';
import { finalize, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-member-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    RadioButtonModule,
    AutoCompleteModule,
    NgxMaskDirective,
  ],
  templateUrl: './member-form-page.component.html',
  styleUrls: ['./member-form-page.component.scss'],
})
export class MemberFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MembersService);
  private readonly churchRolesService = inject(ChurchRolesService);
  private readonly organizationsService = inject(OrganizationsService);
  private readonly cepLookupService = inject(CepLookupService);
  readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  mode = computed<'create' | 'edit'>(() =>
    this.route.snapshot.paramMap.has('id') ? 'edit' : 'create',
  );
  memberId = signal<string | null>(this.route.snapshot.paramMap.get('id'));

  saving = signal(false);
  loading = signal(false);
  churchRoles = signal<ChurchRole[]>([]);
  congregations = signal<OrganizationUnit[]>([]);
  rootChurch = signal<OrganizationUnit | null>(null);
  allMembers = signal<Member[]>([]);
  isCepLookupLoading = signal(false);

  spouseSearchControl = new FormControl<Member | null>(null);
  fatherSearchControl = new FormControl<Member | null>(null);
  motherSearchControl = new FormControl<Member | null>(null);
  congregationSearchControl = new FormControl<OrganizationUnit | null>(null);

  filteredMembers: Member[] = [];
  filteredCongregations: OrganizationUnit[] = [];

  churchRoleOptions: { label: string; value: string | null }[] = [];
  maritalStatusOptions = [
    { label: 'Não informado', value: null },
    { label: 'Solteiro(a)', value: 'SINGLE' },
    { label: 'Casado(a)', value: 'MARRIED' },
    { label: 'Viúvo(a)', value: 'WIDOWED' },
    { label: 'Divorciado(a)', value: 'DIVORCED' },
    { label: 'Separado(a)', value: 'SEPARATED' },
  ];
  statusOptions = [
    { label: 'Ativo', value: 'ACTIVE' },
    { label: 'Inativo', value: 'INACTIVE' },
    { label: 'Falecido', value: 'DECEASED' },
  ];

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

    this.congregationSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value === null) {
          this.form.controls.organizationUnitId.setValue('');
        }
      });
  }

  searchCongregations(event: { query: string }): void {
    const term = event.query.toLowerCase().trim();
    const source = this.congregations();
    this.filteredCongregations = (term.length >= 2
      ? source.filter((org) => org.name.toLowerCase().includes(term))
      : source
    ).slice(0, 20);
  }

  searchMembersFor(field: 'spouse' | 'father' | 'mother', event: { query: string }): void {
    const term = event.query.toLowerCase().trim();
    this.filteredMembers = term.length >= 2
      ? this.allMembers().filter((m) => m.fullName.toLowerCase().includes(term)).slice(0, 20)
      : [];
  }

  onCongregationSelected(event: AutoCompleteSelectEvent): void {
    this.form.controls.organizationUnitId.setValue((event.value as OrganizationUnit).id);
  }

  onCongregationClear(): void {
    this.form.controls.organizationUnitId.setValue('');
  }

  onSpouseSelected(event: AutoCompleteSelectEvent): void {
    this.form.controls.spouseId.setValue((event.value as Member).id);
  }

  onSpouseClear(): void { this.form.controls.spouseId.setValue(null); }

  onFatherSelected(event: AutoCompleteSelectEvent): void {
    this.form.controls.fatherId.setValue((event.value as Member).id);
  }

  onFatherClear(): void { this.form.controls.fatherId.setValue(null); }

  onMotherSelected(event: AutoCompleteSelectEvent): void {
    this.form.controls.motherId.setValue((event.value as Member).id);
  }

  onMotherClear(): void { this.form.controls.motherId.setValue(null); }

  private applyCepResult(result: CepLookupResult) {
    if (result.street) this.form.controls.addressStreet.setValue(result.street);
    if (result.neighborhood) this.form.controls.addressNeighborhood.setValue(result.neighborhood);
    if (result.city) this.form.controls.addressCity.setValue(result.city);
    if (result.state) this.form.controls.addressState.setValue(result.state);
  }

  lookupCep() {
    const cepValue = this.form.controls.addressZipCode.value ?? '';
    if (!this.cepLookupService.isValidCep(cepValue)) {
      this.notificationService.warn('Informe um CEP válido para buscar o endereço.');
      return;
    }
    if (this.isCepLookupLoading()) return;
    this.isCepLookupLoading.set(true);
    this.cepLookupService.lookup(cepValue).pipe(
      take(1),
      finalize(() => this.isCepLookupLoading.set(false)),
    ).subscribe((result) => {
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
        this.churchRoleOptions = [
          { label: 'Nenhum', value: null },
          ...response.data.map((r: ChurchRole) => ({ label: r.name, value: r.id })),
        ];
      },
    });
  }

  loadCongregations() {
    this.organizationsService.listAll().subscribe({
      next: (response) => {
        const allOrgs = response.data || [];
        const rootChurch = allOrgs.find((org: OrganizationUnit) => org.type === 'CHURCH');
        if (rootChurch) this.rootChurch.set(rootChurch);

        const flattenOrganizations = (orgs: OrganizationUnit[]): OrganizationUnit[] => {
          const result: OrganizationUnit[] = [];
          for (const org of orgs) {
            result.push(org);
            if (org.children?.length) result.push(...flattenOrganizations(org.children));
          }
          return result;
        };

        const congregations = flattenOrganizations(allOrgs).filter(
          (org) => org.type === 'CONGREGATION' && org.status === 'ACTIVE',
        );
        this.congregations.set(congregations);
        this.filteredCongregations = congregations.slice(0, 20);

        const memberId = this.memberId();
        if (this.mode() === 'edit' && memberId) {
          this.loadMember(memberId, congregations);
        }
      },
      error: () => this.congregations.set([]),
    });
  }

  private loadMember(id: string, congregations: OrganizationUnit[]) {
    this.loading.set(true);
    this.service.getById(id).subscribe({
      next: (response) => {
        const member = response.data;
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

        const currentCongregation = congregations.find(
          (org) => org.id === member.organizationUnitId,
        );
        if (currentCongregation) {
          this.congregationSearchControl.setValue(currentCongregation);
        }

        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Não foi possível carregar os dados do membro.');
        this.loading.set(false);
        this.router.navigate(['/app/members']);
      },
    });
  }

  loadAllMembers() {
    this.service.listAll(undefined, undefined, undefined, undefined, 0, 1000).subscribe({
      next: (response) => {
        const currentMemberId = this.memberId();
        const members = currentMemberId
          ? response.data.content.filter((m: Member) => m.id !== currentMemberId)
          : response.data.content;
        this.allMembers.set(members);

        const memberId = this.memberId();
        if (this.mode() === 'edit' && memberId) {
          this.service.getById(memberId).subscribe({
            next: (response) => {
              const member = response.data;
              if (member.family?.spouseId) {
                const spouse = members.find((m: Member) => m.id === member.family!.spouseId);
                if (spouse) this.spouseSearchControl.setValue(spouse);
              }
              if (member.family?.fatherId) {
                const father = members.find((m: Member) => m.id === member.family!.fatherId);
                if (father) this.fatherSearchControl.setValue(father);
              }
              if (member.family?.motherId) {
                const mother = members.find((m: Member) => m.id === member.family!.motherId);
                if (mother) this.motherSearchControl.setValue(mother);
              }
            },
          });
        }
      },
    });
  }

  cancel() {
    this.router.navigate(['/app/members']);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.form.getRawValue();

    const address = formValue.addressStreet || formValue.addressNumber || formValue.addressCity
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
      birthDate: formValue.birthDate ? (formValue.birthDate as Date).toISOString().split('T')[0] : null,
      baptismDate: formValue.baptismDate ? (formValue.baptismDate as Date).toISOString().split('T')[0] : null,
      baptismChurch: formValue.baptismChurch || null,
      baptismLocation: formValue.baptismLocation || null,
      address,
      churchRoleId: formValue.churchRoleId || null,
      spouseId: formValue.spouseId || null,
      fatherId: formValue.fatherId || null,
      motherId: formValue.motherId || null,
      ...(this.mode() === 'edit' && { status: formValue.status }),
    };

    const memberId = this.memberId();
    const operation = this.mode() === 'create'
      ? this.service.create(request as any)
      : this.service.update(memberId!, request as any);

    operation.subscribe({
      next: () => {
        const message = this.mode() === 'create' ? 'Membro criado com sucesso' : 'Membro atualizado com sucesso';
        this.notificationService.success(message);
        this.router.navigate(['/app/members']);
      },
      error: (error) => {
        const message = error?.error?.message ?? 'Não foi possível salvar o membro.';
        this.notificationService.error(message);
        this.saving.set(false);
      },
    });
  }

  getCongregationLabel(): string {
    return this.rootChurch()?.congregationLabel ?? 'Congregação';
  }
}
