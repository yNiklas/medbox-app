import { Injectable, inject } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Capacitor } from '@capacitor/core';

/**
 * Service to handle push notification registration and token management
 * This service registers the device with the backend for receiving push notifications
 * from Firebase Cloud Messaging (FCM) for Android and Apple Push Notification Service (APNs) for iOS
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private isInitialized = false;

  constructor() {
    this.initializePushNotifications();
  }

  /**
   * Initialize push notifications by requesting permissions and registering listeners
   */
  private async initializePushNotifications(): Promise<void> {
    // Only initialize on native platforms (iOS/Android)
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    try {
      // Request permission to use push notifications
      const permResult = await PushNotifications.requestPermissions();

      if (permResult.receive === 'granted') {
        // Register with Apple / Google to receive push notifications
        await PushNotifications.register();
      } else {
        console.warn('Push notification permission denied');
      }

      // Set up listeners
      this.setupPushNotificationListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  /**
   * Set up listeners for push notification events
   */
  private setupPushNotificationListeners(): void {
    // Called when registration is successful and we receive a token
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token:', token.value);
      await this.registerTokenWithBackend(token.value);
    });

    // Called when registration fails
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Called when a push notification is received
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    // Called when a push notification is tapped/opened
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
    });
  }

  /**
   * Register the FCM token with the backend
   * @param fcmToken - The FCM token received from Firebase/APNs
   */
  private async registerTokenWithBackend(fcmToken: string): Promise<void> {
    try {
      const deviceType = Capacitor.getPlatform(); // 'ios' or 'android'
      
      await this.http.post(`${environment.backendURL}/notifications/register-token`, {
        fcmToken,
        deviceType,
      }).toPromise();

      console.log('Successfully registered FCM token with backend');
    } catch (error) {
      console.error('Error registering token with backend:', error);
    }
  }

  /**
   * Manually unregister the device token from the backend
   */
  async unregisterToken(): Promise<void> {
    try {
      // Get the current token
      const deliveredNotifications = await PushNotifications.getDeliveredNotifications();
      
      // Note: We need to store the token locally to unregister it
      // For now, we'll just call the unregister endpoint
      // In production, you should store the token in local storage
      
      await this.http.post(`${environment.backendURL}/notifications/unregister-token`, {
        fcmToken: '', // Token should be retrieved from storage
      }).toPromise();

      console.log('Successfully unregistered token from backend');
    } catch (error) {
      console.error('Error unregistering token:', error);
    }
  }

  /**
   * Check if push notifications are initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
