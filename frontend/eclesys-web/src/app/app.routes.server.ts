import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'app/santa-ceia/v2/:eventId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'app/santa-ceia/:eventId',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
