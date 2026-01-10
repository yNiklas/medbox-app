# Push Notification Service Usage Guide

This document explains how the push notification system works in the MedBox app.

## Architecture Overview

The MedBox app uses **push notifications** delivered via Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs). 

**Key Points:**
- The frontend **only registers the device token** with the backend
- The **backend sends all notifications** when events occur
- No polling or frontend monitoring is required
- Notifications work even when the app is closed or in background

## How It Works

1. **App Startup**: NotificationService automatically initializes
2. **Permission Request**: App requests push notification permissions from user
3. **Token Registration**: Device receives FCM token from FCM/APNs
4. **Backend Registration**: Token is automatically sent to backend `/api/v1/notifications/register-token`
5. **Backend Sends Notifications**: When events occur (pills dispensed, etc.), backend sends push notifications to registered devices

## Frontend Implementation

### Automatic Initialization

The NotificationService is automatically initialized when the app starts:

```typescript
// src/app/app.component.ts
import { Component, inject } from '@angular/core';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  // ...
})
export class AppComponent {
  private notificationService = inject(NotificationService);
  // NotificationService automatically registers for push notifications
}
```

### Service Methods

The NotificationService provides these methods:

```typescript
// Check if push notifications are ready
const isReady = this.notificationService.isReady();

// Manually unregister device token (e.g., on logout)
await this.notificationService.unregisterToken();
```

## Backend Integration

### Token Registration

When the app receives an FCM token, it automatically calls:

```http
POST /api/v1/notifications/register-token
Content-Type: application/json

{
  "fcmToken": "device-fcm-token-here",
  "deviceType": "ios" | "android"
}
```

### Sending Notifications from Backend

When events occur, the backend should send push notifications using FCM/APNs:

#### Pills Dispensed Example

```typescript
// Backend pseudocode
async function onPillsDispensed(userId, compartment, box) {
  // Get user's registered device tokens
  const tokens = await getDeviceTokens(userId);
  
  // Send push notification
  await sendPushNotification(tokens, {
    notification: {
      title: 'Pills Dispensed',
      body: `${compartment.name} from ${box.name} has been dispensed`
    },
    data: {
      type: 'pill_dispensed',
      compartmentId: compartment.id,
      boxId: box.id,
      timestamp: Date.now()
    }
  });
}
```

#### Pills Running Low Example

```typescript
async function onPillsRunningLow(userId, compartment, box) {
  const tokens = await getDeviceTokens(userId);
  
  await sendPushNotification(tokens, {
    notification: {
      title: 'Pills Running Low',
      body: `${compartment.name} needs refilling (${compartment.remainingPills} pills left)`
    },
    data: {
      type: 'pills_running_low',
      compartmentId: compartment.id,
      boxId: box.id,
      remainingPills: compartment.remainingPills
    }
  });
}
```

## Handling Incoming Notifications

The NotificationService automatically sets up listeners for push notifications:

```typescript
// In NotificationService (already implemented)
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Push notification received:', notification);
  // Notification is displayed automatically by the system
});

PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
  console.log('Push notification tapped:', notification);
  // You can navigate to specific screens here based on notification.data
});
```

### Custom Notification Handling

If you need to handle notifications when they're tapped:

```typescript
import { PushNotifications } from '@capacitor/push-notifications';
import { Router } from '@angular/router';

export class MyService {
  constructor(private router: Router) {
    this.setupNotificationHandlers();
  }
  
  private setupNotificationHandlers() {
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const data = notification.notification.data;
      
      // Navigate based on notification type
      switch (data.type) {
        case 'pill_dispensed':
          this.router.navigate(['/compartment', data.compartmentId]);
          break;
        case 'pills_running_low':
          this.router.navigate(['/refill', data.compartmentId]);
          break;
      }
    });
  }

## Testing

### Testing on Device

```bash
# Build and sync
npm run build
npx cap sync

# Open in IDE
npx cap open android  # or ios
```

### Sending Test Notifications

Use Firebase Console to send test notifications:
1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter title and body
4. Select your app
5. Send to specific FCM token or all devices

### Testing Different Notification Types

```typescript
// Send from Firebase Console with custom data
{
  "notification": {
    "title": "Test Pills Dispensed",
    "body": "Test notification"
  },
  "data": {
    "type": "pill_dispensed",
    "compartmentId": "123",
    "boxId": "456"
  }
}
```

## Best Practices

1. **Let Backend Handle Logic**: Don't monitor or poll from frontend. Backend sends notifications when events occur.

2. **Handle Permissions Gracefully**: The app automatically requests permissions on startup.

3. **Store Tokens Securely**: Backend should securely store FCM tokens associated with authenticated users.

4. **Handle Token Updates**: Tokens can change when app is reinstalled. NotificationService automatically re-registers.

5. **Test on Physical Devices**: iOS push notifications don't work in simulator.

## Troubleshooting

### Notifications Not Received

1. **Check permissions**: Verify notification permissions are granted in device settings
2. **Verify FCM token**: Check backend logs to confirm token was registered
3. **Test with Firebase Console**: Send test notification to verify FCM/APNs setup
4. **Check backend logs**: Verify backend is sending notifications successfully
5. **Physical device**: iOS push notifications require physical device (not simulator)

### Token Not Registered

1. **Check console logs**: Look for "Push registration success" message
2. **Verify backend endpoint**: Ensure `/api/v1/notifications/register-token` is working
3. **Check network**: Verify app can reach backend
4. **Platform check**: Ensure running on iOS/Android (not web)

### Permission Denied

- User must manually enable notifications in device settings
- App will request permission again on next startup
- Consider adding in-app explanation before requesting permissions

## Platform-Specific Notes

### Android
- Requires `google-services.json` from Firebase
- Notifications work in emulator and device
- Can customize notification icon and color

### iOS
- Requires APNs certificate uploaded to Firebase
- Notifications only work on physical devices (not simulator)
- Background modes must be enabled in Xcode

### Web
- Push notifications not supported in web version
- Service only initializes on native platforms

## See Also

- [NOTIFICATIONS.md](./NOTIFICATIONS.md) - Complete technical documentation
- [NOTIFICATION_SUMMARY.md](./NOTIFICATION_SUMMARY.md) - Implementation overview
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
