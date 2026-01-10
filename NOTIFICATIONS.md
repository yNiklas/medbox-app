# MedBox Notification System Documentation

## Overview
This document describes the push notification functionality implemented for the MedBox app. The backend sends push notifications directly to devices via Firebase Cloud Messaging (FCM) for Android and Apple Push Notification Service (APNs) for iOS.

## Frontend Implementation

### Components Added

1. **NotificationService** (`src/app/services/notification.service.ts`)
   - Handles push notification registration and token management
   - Automatically registers device with FCM/APNs on app startup
   - Sends device token to backend for notification delivery
   - Methods:
     - `initializePushNotifications()`: Register for push notifications (called automatically)
     - `registerTokenWithBackend(fcmToken)`: Send FCM token to backend
     - `unregisterToken()`: Remove device token from backend
     - `isReady()`: Check if push notifications are initialized

2. **Updated AppComponent** (`src/app/app.component.ts`)
   - Initializes NotificationService on app startup
   - Ensures automatic registration for push notifications

### Dependencies Added

- `@capacitor/push-notifications`: Capacitor plugin for push notifications (v8.0.0)

## Backend Requirements

### 1. Push Notification Service Setup

The backend must be configured to send push notifications via:
- **Firebase Cloud Messaging (FCM)** for Android
- **Apple Push Notification Service (APNs)** for iOS

#### Firebase Cloud Messaging Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Add your Android app to the project
3. Download `google-services.json` and place in Android app directory
4. Obtain the Server Key from Firebase Console > Project Settings > Cloud Messaging
5. Use this key in your backend to send notifications

#### Apple Push Notification Service Setup
1. Create an APNs certificate in Apple Developer Console
2. Upload the certificate to Firebase Console
3. Configure your iOS app with the appropriate provisioning profile
    "timestamp": 1234567890,
    "pillsDispensed": 2
  }
}

### 2. Backend API Endpoints

The backend provides the following endpoints for device token registration:

```
POST /api/v1/notifications/register-token
{
  "fcmToken": "string",
  "deviceType": "string"  // "ios" or "android"
}
```

```
POST /api/v1/notifications/unregister-token
{
  "fcmToken": "string"
}
```

### 3. Sending Push Notifications from Backend

When events occur (pills dispensed, running low, etc.), the backend should:

1. **Query registered devices**: Get FCM tokens for the user from the `device_tokens` table
2. **Send push notification**: Use FCM/APNs to send notification to all user's devices
3. **Log notification**: Record in `notification_logs` table for audit trail

#### Push Notification Payload Structure

**For Pills Dispensed:**
```json
{
  "notification": {
    "title": "Pills Dispensed",
    "body": "Metformin from Joe's Box has been dispensed"
  },
  "data": {
    "type": "pill_dispensed",
    "compartmentId": "123",
    "boxId": "456",
    "timestamp": "1234567890"
  }
}
```

**For Pills Running Low:**
```json
{
  "notification": {
    "title": "Pills Running Low",
    "body": "Metformin in Joe's Box needs refilling (3 pills left)"
  },
  "data": {
    "type": "pills_running_low",
    "compartmentId": "123",
    "boxId": "456",
    "remainingPills": "3"
  }
}
```

**For Missed Dose:**
```json
{
  "notification": {
    "title": "Missed Dose",
    "body": "Scheduled dose for Metformin was not dispensed"
  },
  "data": {
    "type": "missed_dose",
    "compartmentId": "123",
    "boxId": "456",
    "scheduledTime": "1234567890"
  }
}
```

### 4. Backend Event Triggers

The backend should send push notifications when:

1. **Pills Dispensed**: When the MedBox hardware physically dispenses pills
2. **Pills Running Low**: When remaining pills fall below threshold (e.g., < 10% of capacity)
3. **Missed Dose**: When scheduled dispense doesn't occur within expected timeframe
4. **Compartment Error**: When there's an issue with dispensing mechanism
5. **Box Offline**: When MedBox device hasn't checked in for extended period

### 5. Additional Backend Endpoints (Optional)

For enhanced functionality, consider implementing:

```
GET /api/v1/users/notification-preferences
Returns user's notification preferences

PUT /api/v1/users/notification-preferences
{
  "pillDispensed": boolean,
  "pillsRunningLow": boolean,
  "missedDose": boolean,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00"
}

GET /api/v1/notifications/history
Returns history of sent notifications

POST /api/v1/notifications/test
Trigger a test notification
```

### 6. Database Schema Updates

Add tables/collections for:

```sql
-- Notification history
CREATE TABLE notification_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  compartment_id INTEGER REFERENCES compartments(id),
  box_id INTEGER REFERENCES boxes(id),
  type VARCHAR(50), -- 'dispensed', 'running_low', 'missed_dose', 'error'
  message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT FALSE
);

-- User notification preferences
CREATE TABLE notification_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  pill_dispensed BOOLEAN DEFAULT TRUE,
  pills_running_low BOOLEAN DEFAULT TRUE,
  missed_dose BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device tokens for push notifications (if using push)
CREATE TABLE device_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  platform VARCHAR(10), -- 'ios', 'android'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Mobile Platform Configuration

### Android Setup

1. **Add Firebase Configuration**:
   - Download `google-services.json` from Firebase Console
   - Place it in `android/app/` directory

2. **Update AndroidManifest.xml** (in `android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

3. **Add Firebase dependencies** (in `android/app/build.gradle`):
```gradle
dependencies {
    // ... other dependencies
    implementation platform('com.google.firebase:firebase-bom:32.0.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

4. **Add notification icon**:
   - Place notification icons in `android/app/src/main/res/drawable/`
   - Recommended sizes: 24x24dp (mdpi), 36x36dp (hdpi), 48x48dp (xhdpi), 72x72dp (xxhdpi)

### iOS Setup

1. **Add APNs Certificate to Firebase**:
   - Create APNs certificate in Apple Developer Console
   - Upload to Firebase Console > Project Settings > Cloud Messaging

2. **Update Info.plist** (in `ios/App/App/Info.plist`):
```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

3. **Enable Push Notifications capability**:
   - In Xcode, select the App target
   - Go to "Signing & Capabilities"
   - Add "Push Notifications" capability
   - Add "Background Modes" and enable "Remote notifications"

### Build and Sync Capacitor

After making changes, sync the native projects:

```bash
# Build the web app
npm run build

# Sync with native platforms
npx cap sync

# For Android
npx cap open android

# For iOS
npx cap open ios
```

## Testing Notifications

### Testing Push Notifications

1. **Android Device/Emulator**:
```bash
npm run build
npx cap sync
npx cap open android
```
Then run the app in Android Studio. Use Firebase Console to send test notifications.

2. **iOS Device** (Push notifications don't work in simulator):
```bash
npm run build
npx cap sync
npx cap open ios
```
Run on a physical device. Use Firebase Console or APNs to send test notifications.

### Test Scenarios

1. **Device Registration**: Launch app and verify FCM token is registered in backend logs
2. **Backend Triggers**: Simulate pill dispense event in backend and verify notification arrives
3. **Multiple Devices**: Test that notifications are delivered to all registered devices
4. **Notification Actions**: Tap notification and verify app opens appropriately
2. **Pill Dispensed**: Trigger a dispense event from backend and verify notification
3. **Pills Running Low**: Set a compartment's `runningOut` to true and verify notification
4. **Notification Tapping**: Tap notification and verify app opens
5. **Background Notifications**: App in background/closed, verify notifications still work

## Security Considerations

1. **Permission Handling**: App requests push notification permissions on startup
2. **Rate Limiting**: Backend should implement rate limiting to prevent notification spam
3. **Data Privacy**: Avoid including sensitive medical information in notification titles/bodies
4. **Token Management**: Securely store device tokens in backend database with user authentication
5. **Authentication**: Ensure token registration endpoints require proper user authentication
6. **Token Rotation**: Handle token refresh/rotation when devices reinstall the app

## Production Checklist

- [ ] Set up Firebase project and configure FCM
- [ ] Configure APNs certificates for iOS
- [ ] Add backend endpoints for token registration/unregistration
- [ ] Implement push notification sending in backend
- [ ] Update database schema for notification logs and device tokens
- [ ] Configure Android Firebase integration (`google-services.json`)
- [ ] Configure iOS push notification capabilities
- [ ] Test notifications on physical devices (Android & iOS)
- [ ] Implement notification preferences endpoint in backend
- [ ] Add quiet hours functionality in backend
- [ ] Implement notification analytics and monitoring
- [ ] Add error handling and retry logic for failed notifications
- [ ] Test notification delivery across multiple devices
- [ ] Monitor FCM/APNs quota and limits

## Implementation Notes

1. **No Polling Required**: The frontend only registers the device token. The backend handles all notification logic and delivery.
2. **Push vs Local**: Uses push notifications (not local) so notifications work even when app is closed/in background.
3. **Automatic Registration**: Device token is automatically registered on app startup.
4. **Cross-Platform**: Works on both iOS and Android using the same codebase.

## Recommended Enhancements

1. **Notification Preferences**: Let users control notification types and quiet hours
2. **Notification History**: Show past notifications in the app
3. **Rich Notifications**: Add images and action buttons to notifications
4. **Notification Grouping**: Group related notifications by MedBox or timeframe
5. **Analytics**: Track notification delivery rates and user engagement
6. **Deep Linking**: Open specific screens when notifications are tapped

## Support

For issues or questions:
- Check Capacitor documentation: https://capacitorjs.com/docs/apis/local-notifications
- Review Ionic documentation: https://ionicframework.com/
- Check platform-specific guides for Android and iOS notification best practices
