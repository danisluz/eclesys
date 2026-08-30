import { Routes } from '@angular/router';
import { CommunionEventsPageComponent } from './pages/communion-events-page/communion-events-page.component';
import { CommunionEventDetailPageComponent } from './pages/communion-event-detail-page/communion-event-detail-page.component';
import { CommunionEventsV2PageComponent } from './pages/communion-events-v2-page/communion-events-v2-page.component';
import { CommunionEventDetailV2PageComponent } from './pages/communion-event-detail-v2-page/communion-event-detail-v2-page.component';

export const COMMUNION_ROUTES: Routes = [
  { path: 'v2', component: CommunionEventsV2PageComponent },
  { path: 'v2/:eventId', component: CommunionEventDetailV2PageComponent },
  { path: '', component: CommunionEventsPageComponent },
  { path: ':eventId', component: CommunionEventDetailPageComponent },
];
