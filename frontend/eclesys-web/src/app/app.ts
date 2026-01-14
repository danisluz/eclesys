import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div class="public-shell">
      <router-outlet />
    </div>
  `})
export class App {}
