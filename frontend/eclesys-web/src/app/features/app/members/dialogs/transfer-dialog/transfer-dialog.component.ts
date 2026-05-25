import { Component, inject, signal, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';
import { Member } from '../../../../../shared/models/member.model';
import { MembersService } from '../../../../../shared/api/members.service';
import { OrganizationsService } from '../../../../../shared/api/organizations.service';
import { OrganizationUnit } from '../../../../../shared/api/organization-unit.model';

@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    RadioButtonModule,
    ProgressSpinnerModule,
    TextareaModule,
  ],
  templateUrl: './transfer-dialog.component.html',
  styleUrls: ['./transfer-dialog.component.scss'],
})
export class TransferDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly membersService = inject(MembersService);
  private readonly organizationsService = inject(OrganizationsService);

  @Input() member!: Member;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: FormGroup;
  congregations = signal<OrganizationUnit[]>([]);
  rootChurch = signal<OrganizationUnit | null>(null);
  loadingCongregations = signal(true);
  saving = signal(false);

  constructor() {
    this.form = this.fb.group({
      transferType: ['internal', Validators.required],
      toCongregationId: [null],
      externalDestination: [null],
      reason: ['', Validators.required],
    });

    this.form.get('transferType')?.valueChanges.subscribe((type) => {
      if (type === 'internal') {
        this.form.get('toCongregationId')?.setValidators([Validators.required]);
        this.form.get('externalDestination')?.clearValidators();
        this.form.get('externalDestination')?.setValue(null);
      } else {
        this.form.get('toCongregationId')?.clearValidators();
        this.form.get('toCongregationId')?.setValue(null);
        this.form.get('externalDestination')?.setValidators([Validators.required]);
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
        const rootChurch = response.data.find((org) => org.type === 'CHURCH');
        if (rootChurch) this.rootChurch.set(rootChurch);

        const extractCongregations = (orgs: OrganizationUnit[]): OrganizationUnit[] => {
          let result: OrganizationUnit[] = [];
          for (const org of orgs) {
            if (org.type === 'CONGREGATION') result.push(org);
            if (org.children?.length)
              result = [...result, ...extractCongregations(org.children)];
          }
          return result;
        };

        this.congregations.set(extractCongregations(response.data));
        this.loadingCongregations.set(false);
      },
      error: () => {
        this.loadingCongregations.set(false);
      },
    });
  }

  getCongregationLabel(): string {
    return this.rootChurch()?.congregationLabel ?? 'Congregação';
  }

  cancel() {
    this.cancelled.emit();
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
        formValue.transferType === 'internal' ? formValue.toCongregationId : null,
      externalDestination:
        formValue.transferType === 'external' ? formValue.externalDestination : null,
      reason: formValue.reason,
    };
    this.membersService.transferMember(this.member.id, request).subscribe({
      next: () => {
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
