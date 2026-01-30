import { Routes } from '@angular/router';
import { CommunionEventsPageComponent } from './pages/communion-events-page/communion-events-page.component';
import { CommunionEventDetailPageComponent } from './pages/communion-event-detail-page/communion-event-detail-page.component';

export const COMMUNION_ROUTES: Routes = [
  { path: '', component: CommunionEventsPageComponent },
  { path: ':eventId', component: CommunionEventDetailPageComponent },
];
