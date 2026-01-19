import { Component, computed, input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss',
})
export class UserAvatarComponent {
  userNameSignal = input.required<string | null>();
  userEmailSignal = input<string | null>(null);

  sizeSignal = input<number>(36);
  ariaLabelSignal = input<string>('Avatar do usuário');

  sizePxSignal = computed(() => `${this.sizeSignal()}px`);

  initialsSignal = computed(() => {
    const fullName = (this.userNameSignal() ?? '').trim();
    if (fullName.length === 0) return '?';

    const parts = fullName.split(/\s+/).filter(Boolean);

    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    const first = parts[0].slice(0, 1);
    const last = parts[parts.length - 1].slice(0, 1);
    return (first + last).toUpperCase();
  });

  backgroundColorSignal = computed(() => {
    const seed = ((this.userEmailSignal() ?? '') || (this.userNameSignal() ?? '') || 'user').trim();

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 50%)`;
  });
}
