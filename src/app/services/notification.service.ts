import { Injectable, inject } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessagingService } from './firebase-messaging.service';

/**
 * Service to handle push notification registration and token management
 * This service registers the device with the backend for receiving push notifications
 * from Firebase Cloud Messaging (FCM) for Android and Apple Push Notification Service (APNs) for iOS
 * and FCM for web/PWA platforms
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private firebaseMessaging = inject(FirebaseMessagingService);
  private isInitialized = false;

  constructor() {
    this.initializePushNotifications();
  }

  /**
   * Initialize push notifications by requesting permissions and registering listeners
   */
  private async initializePushNotifications(): Promise<void> {
    // Check platform and initialize accordingly
    if (Capacitor.isNativePlatform()) {
      await this.initializeNativePushNotifications();
    } else {
      await this.initializeWebPushNotifications();
    }
  }

  /**
   * Initialize push notifications for native platforms (iOS/Android)
   */
  private async initializeNativePushNotifications(): Promise<void> {
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
      this.setupNativePushNotificationListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing native push notifications:', error);
    }
  }

  /**
   * Initialize push notifications for web/PWA platform
   */
  private async initializeWebPushNotifications(): Promise<void> {
    if (!this.firebaseMessaging.isSupported()) {
      console.log('Web push notifications not supported in this browser');
      return;
    }

    try {
      // Register service worker
      await this.registerServiceWorker();
      
      // Request permission and get FCM token
      const token = await this.firebaseMessaging.requestPermissionAndGetToken();
      
      if (token) {
        await this.registerTokenWithBackend(token, 'web');
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Error initializing web push notifications:', error);
    }
  }

  /**
   * Register the service worker for Firebase messaging
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Set up listeners for push notification events (native platforms)
   */
  private setupNativePushNotificationListeners(): void {
    // Called when registration is successful and we receive a token
    PushNotifications.addListener('registration', async (token: any) => {
      console.log('Push registration success, token:', token.value);
      await this.registerTokenWithBackend(token.value);
    });

    // Called when registration fails
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // Called when a push notification is received
    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('Push notification received:', notification);
    });

    // Called when a push notification is tapped/opened
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
      console.log('Push notification action performed:', notification);
    });
  }

  /**
   * Register the FCM token with the backend
   * @param fcmToken - The FCM token received from Firebase/APNs
   * @param deviceType - The device type (ios, android, or web)
   */
  private async registerTokenWithBackend(fcmToken: string, deviceType?: string): Promise<void> {
    try {
      const platform = deviceType || Capacitor.getPlatform(); // 'ios', 'android', or 'web'

      await this.http.post(`${environment.backendURL}/notifications/register-token`, {
        fcmToken,
        deviceType: platform,
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
