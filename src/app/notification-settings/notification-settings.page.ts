import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { NotificationService } from '../services/notification.service';
import { NotificationIntegrationService } from '../services/notification-integration.service';

/**
 * Example component demonstrating notification service usage
 * This component can be used as a settings page for notification preferences
 */
@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
})
export class NotificationSettingsPage implements OnInit {
  private notificationService = inject(NotificationService);
  private notificationIntegration = inject(NotificationIntegrationService);

  permissionGranted = false;
  pendingNotifications: any[] = [];

  async ngOnInit() {
    await this.checkPermissionStatus();
    await this.loadPendingNotifications();
  }

  async checkPermissionStatus() {
    this.permissionGranted = await this.notificationService.checkPermissions();
  }

  async requestPermissions() {
    const granted = await this.notificationService.requestPermissions();
    this.permissionGranted = granted;
  }

  async loadPendingNotifications() {
    const result = await this.notificationService.getPendingNotifications();
    this.pendingNotifications = result.notifications;
  }

  async cancelAllNotifications() {
    await this.notificationService.cancelAllNotifications();
    await this.loadPendingNotifications();
  }

  async sendTestNotification() {
    // Create a test compartment and box for demonstration
    // Using negative IDs to avoid conflicts with real data
    const testCompartment = {
      id: -999,
      name: 'Test Medication',
      intervals: undefined,
      remainingPills: 10,
      lastDispenseTime: Date.now(),
      runningOut: false,
    };

    const testBox = {
      id: -888,
      mac: 'AA:BB:CC:DD:EE:FF',
      name: 'Test Box',
      status: {
        lastSeenAt: Date.now(),
        error: undefined,
      },
      compartments: [testCompartment],
    };

    await this.notificationService.notifyPillDispensed(testCompartment, testBox);
  }
}
