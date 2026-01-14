import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  plan = signal('PRO');

  churchName = '';
  adminName = '';
  email = '';
  tenantCode = '';

  submitted = signal(false);

  constructor(route: ActivatedRoute) {
    let queryPlan = route.snapshot.queryParamMap.get('plan');
    if (queryPlan) this.plan.set(queryPlan);
  }

  submit() {
    this.submitted.set(true);
  }
}
