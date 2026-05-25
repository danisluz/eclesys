import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-public-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
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
