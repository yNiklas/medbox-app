import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { environment } from '../../environments/environment';

/**
 * Service to handle Firebase Cloud Messaging (FCM) for web push notifications
 * This service is specifically for web/PWA platform push notifications
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseMessagingService {
  private messaging: Messaging | null = null;

  constructor() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase app and messaging
   */
  private initializeFirebase(): void {
    try {
      // Validate Firebase configuration
      if (!this.isFirebaseConfigValid()) {
        console.warn('Firebase configuration not set. Please configure Firebase in environment files.');
        return;
      }

      // Initialize Firebase
      const app = initializeApp(environment.firebase);
      
      // Get messaging instance
      this.messaging = getMessaging(app);
      
      // Listen for foreground messages
      this.setupForegroundListener();
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }

  /**
   * Validate that Firebase configuration has been set with actual values
   */
  private isFirebaseConfigValid(): boolean {
    const config = environment.firebase;
    
    // Check if configuration exists and has actual values (not placeholders)
    return !!(
      config &&
      config.apiKey &&
      config.projectId &&
      config.messagingSenderId &&
      config.appId &&
      config.vapidKey &&
      !config.apiKey.startsWith('YOUR_') &&
      !config.projectId.startsWith('YOUR_')
    );
  }

  /**
   * Request notification permission and get FCM token
   * @returns Promise with the FCM token or null if permission denied
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    if (!this.messaging) {
      console.error('Firebase messaging not initialized');
      return null;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        
        // Get FCM token
        const token = await getToken(this.messaging, {
          vapidKey: environment.firebase.vapidKey
        });
        
        if (token) {
          console.log('FCM Token:', token);
          return token;
        } else {
          console.log('No registration token available.');
          return null;
        }
      } else {
        console.log('Notification permission denied.');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Setup listener for foreground messages
   * Messages received when the app is in the foreground
   */
  private setupForegroundListener(): void {
    if (!this.messaging) {
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Display notification manually when app is in foreground
      if (payload.notification) {
        this.showNotification(
          payload.notification.title || 'MedBox Notification',
          payload.notification.body || 'You have a new notification',
          payload.data
        );
      }
    });
  }

  /**
   * Show a notification using the Notifications API
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Additional data
   */
  private showNotification(title: string, body: string, data?: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/assets/icon/favicon.png',
        badge: '/assets/icon/favicon.png',
        data: data,
        tag: data?.tag || 'medbox-notification',
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  /**
   * Check if FCM is supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'Notification' in window;
  }
}
