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
import { Member } from '../../../../../shared/models/member.model';
import { MembersService } from '../../../../../shared/api/members.service';
import { OrganizationsService } from '../../../../../shared/api/organizations.service';
import { OrganizationUnit } from '../../../../../shared/api/organization-unit.model';

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
  templateUrl: './transfer-dialog.component.html',
  styleUrls: ['./transfer-dialog.component.scss'],

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
