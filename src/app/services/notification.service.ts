import { Injectable } from '@angular/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Compartment } from '../model/Compartment';
import { MedBox } from '../model/MedBox';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationId = 1;

  constructor() {
    this.initializeNotifications();
  }

  /**
   * Initialize notifications by requesting permissions and setting up listeners
   */
  private async initializeNotifications(): Promise<void> {
    try {
      // Check and request permissions
      const permissionStatus = await LocalNotifications.checkPermissions();
      if (permissionStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      // Set up notification action listeners
      await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification action performed:', notification);
      });
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Request notification permissions from the user
   * @returns Promise<boolean> - true if permission granted, false otherwise
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notification permissions are granted
   * @returns Promise<boolean> - true if permission granted, false otherwise
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Send an immediate notification when pills are dispensed
   * @param compartment - The compartment from which pills were dispensed
   * @param box - The MedBox that dispensed the pills
   */
  async notifyPillDispensed(compartment: Compartment, box: MedBox): Promise<void> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return;
      }

      const notificationOptions: ScheduleOptions = {
        notifications: [
          {
            title: 'Pills Dispensed',
            body: `${compartment.name} from ${box.name} has been dispensed`,
            id: this.notificationId++,
            schedule: { at: new Date(Date.now() + 1000) }, // Schedule for 1 second from now
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: {
              compartmentId: compartment.id,
              boxId: box.id,
            },
          },
        ],
      };

      await LocalNotifications.schedule(notificationOptions);
    } catch (error) {
      console.error('Error sending pill dispensed notification:', error);
    }
  }

  /**
   * Schedule a notification for upcoming pill dispense
   * @param compartment - The compartment that will dispense pills
   * @param box - The MedBox that will dispense the pills
   * @param dispenseTime - The time when pills will be dispensed
   */
  async scheduleDispenseReminder(
    compartment: Compartment,
    box: MedBox,
    dispenseTime: Date
  ): Promise<void> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return;
      }

      const notificationOptions: ScheduleOptions = {
        notifications: [
          {
            title: 'Upcoming Pill Dispense',
            body: `${compartment.name} from ${box.name} will be dispensed soon`,
            id: this.notificationId++,
            schedule: { at: dispenseTime },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: {
              compartmentId: compartment.id,
              boxId: box.id,
            },
          },
        ],
      };

      await LocalNotifications.schedule(notificationOptions);
    } catch (error) {
      console.error('Error scheduling dispense reminder:', error);
    }
  }

  /**
   * Notify when pills are running low
   * @param compartment - The compartment with low pills
   * @param box - The MedBox with the compartment
   */
  async notifyPillsRunningLow(compartment: Compartment, box: MedBox): Promise<void> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return;
      }

      const notificationOptions: ScheduleOptions = {
        notifications: [
          {
            title: 'Pills Running Low',
            body: `${compartment.name} in ${box.name} needs refilling (${compartment.remainingPills} pills left)`,
            id: this.notificationId++,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: {
              compartmentId: compartment.id,
              boxId: box.id,
            },
          },
        ],
      };

      await LocalNotifications.schedule(notificationOptions);
    } catch (error) {
      console.error('Error sending pills running low notification:', error);
    }
  }

  /**
   * Cancel all pending notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  /**
   * Get all pending notifications
   */
  async getPendingNotifications(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }
}
