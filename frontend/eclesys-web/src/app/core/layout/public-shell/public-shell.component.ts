import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-public-shell',
  imports: [RouterLink, RouterOutlet, CommonModule],
  templateUrl: './public-shell.component.html',
  styleUrls: ['./public-shell.component.scss'],
})
export class PublicShellComponent {
  year = new Date().getFullYear();
  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
}
