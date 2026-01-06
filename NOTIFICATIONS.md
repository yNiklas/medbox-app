# MedBox Notification System Documentation

## Overview
This document describes the notification functionality implemented for the MedBox app and outlines the requirements for backend integration and mobile platform configuration.

## Frontend Implementation

### Components Added

1. **NotificationService** (`src/app/services/notification.service.ts`)
   - Handles all notification operations using Capacitor's Local Notifications API
   - Methods:
     - `requestPermissions()`: Request notification permissions from the user
     - `checkPermissions()`: Check if notification permissions are granted
     - `notifyPillDispensed(compartment, box)`: Send immediate notification when pills are dispensed
     - `scheduleDispenseReminder(compartment, box, dispenseTime)`: Schedule future notifications
     - `notifyPillsRunningLow(compartment, box)`: Notify when pills are running low
     - `cancelAllNotifications()`: Cancel all pending notifications
     - `getPendingNotifications()`: Get list of pending notifications

2. **NotificationIntegrationService** (`src/app/services/notification-integration.service.ts`)
   - Integrates with the Backend service to monitor pill dispensing
   - Polls backend every 30 seconds to detect changes
   - Triggers notifications when:
     - Pills are dispensed (lastDispenseTime changes)
     - Pills are running low (runningOut flag is true)
   - Provides `onPillDispensed(compartmentId, boxId)` method for manual triggering

3. **Updated AppComponent** (`src/app/app.component.ts`)
   - Initializes NotificationIntegrationService on app startup
   - Ensures notification monitoring starts with the app

### Dependencies Added

- `@capacitor/local-notifications`: Capacitor plugin for local notifications (v8.0.0)

## Backend Requirements

### 1. Real-time Event Communication

Currently, the frontend uses **polling** (every 30 seconds) to detect changes. For production, implement one of the following:

#### Option A: WebSocket Connection (Recommended)
```typescript
// Backend should send events via WebSocket
{
  "event": "pill_dispensed",
  "data": {
    "compartmentId": 123,
    "boxId": 456,
    "timestamp": 1234567890,
    "pillsDispensed": 2
  }
}

{
  "event": "pills_running_low",
  "data": {
    "compartmentId": 123,
    "boxId": 456,
    "remainingPills": 3
  }
}
```

#### Option B: Server-Sent Events (SSE)
Implement SSE endpoint that pushes events to the frontend:
```
GET /api/v1/events
```

#### Option C: Push Notifications (Best for Mobile)
Implement push notifications using:
- Firebase Cloud Messaging (FCM) for Android
- Apple Push Notification Service (APNs) for iOS

**Backend endpoints needed for push notifications:**
```
POST /api/v1/notifications/register
{
  "deviceToken": "string",
  "platform": "ios" | "android"
}

POST /api/v1/notifications/unregister
{
  "deviceToken": "string"
}
```

### 2. Event Triggers

The backend should trigger notifications when:

1. **Pills Dispensed**: When the MedBox hardware physically dispenses pills
   - Update `lastDispenseTime` in the Compartment
   - Send event to frontend or push notification

2. **Pills Running Low**: When remaining pills fall below threshold
   - Set `runningOut` flag to true
   - Send event to frontend or push notification

3. **Missed Dose**: When scheduled dispense doesn't occur
   - Track missed dispenses
   - Send notification to user

4. **Compartment Error**: When there's an issue with dispensing
   - Send error notification with details

### 3. Backend API Extensions

Add these endpoints to support notification management:

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

### 4. Database Schema Updates

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

1. **Update AndroidManifest.xml** (in `android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

2. **Add notification icon**:
   - Place notification icons in `android/app/src/main/res/drawable/`
   - Recommended sizes: 24x24dp (mdpi), 36x36dp (hdpi), 48x48dp (xhdpi), 72x72dp (xxhdpi)

3. **Configure notification channel** (handled by Capacitor):
   - The app will automatically create a notification channel on Android 8.0+

### iOS Setup

1. **Update Info.plist** (in `ios/App/App/Info.plist`):
```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

2. **Request permission** (handled by the app):
   - The app will request notification permissions on first launch

3. **Enable Push Notifications capability**:
   - In Xcode, select the App target
   - Go to "Signing & Capabilities"
   - Add "Push Notifications" capability

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

### Local Testing

1. **Browser (Web)**: Local notifications are limited in browsers. Use device testing for full functionality.

2. **Android Emulator**:
```bash
npm run build
npx cap sync
npx cap open android
```
Then run the app in Android Studio.

3. **iOS Simulator**:
```bash
npm run build
npx cap sync
npx cap open ios
```
Then run the app in Xcode.

### Test Scenarios

1. **Permission Request**: Launch app and verify permission prompt appears
2. **Pill Dispensed**: Trigger a dispense event from backend and verify notification
3. **Pills Running Low**: Set a compartment's `runningOut` to true and verify notification
4. **Notification Tapping**: Tap notification and verify app opens
5. **Background Notifications**: App in background/closed, verify notifications still work

## Security Considerations

1. **Permission Handling**: Always check and request permissions before sending notifications
2. **Rate Limiting**: Backend should implement rate limiting to prevent notification spam
3. **Data Privacy**: Don't include sensitive medical information in notification titles/bodies
4. **Token Management**: Securely store and manage device tokens for push notifications
5. **Authentication**: Ensure notification endpoints require proper authentication

## Production Checklist

- [ ] Implement real-time event communication (WebSocket/SSE/Push)
- [ ] Add backend endpoints for notification management
- [ ] Update database schema for notification logs and preferences
- [ ] Configure Android notification icons and permissions
- [ ] Configure iOS push notification capabilities
- [ ] Test notifications on physical devices (Android & iOS)
- [ ] Implement notification preferences UI in the app
- [ ] Add quiet hours functionality
- [ ] Set up push notification service (FCM/APNs)
- [ ] Implement notification analytics and monitoring
- [ ] Add error handling and retry logic for failed notifications
- [ ] Document notification payload structure for all platforms

## Limitations of Current Implementation

1. **Polling**: Uses 30-second polling instead of real-time events (should be replaced with WebSocket/Push)
2. **Local Only**: Uses local notifications only (no push notifications for app in background/closed)
3. **No Persistence**: Notification state is not persisted across app restarts
4. **No User Preferences**: Users cannot customize notification settings
5. **Limited Retry**: No retry mechanism if notification fails

## Recommended Improvements

1. **Replace polling with WebSocket**: For real-time updates
2. **Add push notifications**: Using FCM (Android) and APNs (iOS)
3. **Implement notification preferences**: Let users control what they're notified about
4. **Add notification history**: Show past notifications in the app
5. **Smart notifications**: Don't notify during quiet hours
6. **Rich notifications**: Add images, actions, and interactive elements
7. **Notification grouping**: Group related notifications
8. **Analytics**: Track notification delivery and engagement

## Support

For issues or questions:
- Check Capacitor documentation: https://capacitorjs.com/docs/apis/local-notifications
- Review Ionic documentation: https://ionicframework.com/
- Check platform-specific guides for Android and iOS notification best practices
