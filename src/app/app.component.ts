import { Component, inject } from '@angular/core';
import {IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import { NotificationIntegrationService } from './services/notification-integration.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private notificationIntegration = inject(NotificationIntegrationService);

  constructor() {
    // Initialize notification integration on app startup
  }
}
