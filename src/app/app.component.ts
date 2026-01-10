import { Component, inject } from '@angular/core';
import {IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private notificationService = inject(NotificationService);

  constructor() {
    // NotificationService is automatically initialized to register for push notifications
  }
}
