# PWA Web Push Notifications Setup

This document explains how to configure Firebase Cloud Messaging (FCM) for web push notifications in the MedBox app.

## Prerequisites

1. A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
2. Firebase Cloud Messaging enabled in your project

## Configuration Steps

### 1. Get Firebase Configuration

1. Go to your Firebase Console
2. Select your project
3. Go to Project Settings (gear icon)
4. In the "General" tab, scroll down to "Your apps"
5. If you haven't added a web app, click "Add app" and select the web platform (</>) icon
6. Copy the Firebase configuration object

### 2. Update Environment Files

Update the Firebase configuration in both environment files:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

Replace the placeholder values with your actual Firebase configuration:

```typescript
firebase: {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  vapidKey: "YOUR_VAPID_KEY"
}
```

### 3. Generate VAPID Key

1. In Firebase Console, go to Project Settings
2. Click on the "Cloud Messaging" tab
3. Scroll down to "Web configuration"
4. Under "Web Push certificates", click "Generate key pair"
5. Copy the generated key and add it as `vapidKey` in your environment files

### 4. Update Service Worker Configuration

Update the Firebase configuration in `src/firebase-messaging-sw.js`:

Replace the placeholder values in the `firebase.initializeApp()` call with your actual Firebase configuration (same values as step 2, but without the `vapidKey`).

### 5. Update Web Manifest (Optional)

In `src/manifest.webmanifest`, you can update the `gcm_sender_id` with your Firebase messaging sender ID, but this is optional as FCM now uses VAPID keys.

## Testing

1. Build the application:
   ```bash
   npm run build
   ```

2. Serve the built application with a local web server:
   ```bash
   npx http-server www -p 8080
   ```

3. Open the app in a browser (must be HTTPS in production or localhost for testing)

4. Grant notification permissions when prompted

5. Check the browser console for the FCM token

## Backend Integration

The app will send the FCM token to your backend at:
- Endpoint: `{backendURL}/notifications/register-token`
- Method: POST
- Body:
  ```json
  {
    "fcmToken": "string",
    "deviceType": "web"
  }
  ```

Ensure your backend is set up to:
1. Receive and store the FCM token
2. Send push notifications using Firebase Admin SDK
3. Handle token unregistration

## Sending Test Notifications

You can send test notifications from Firebase Console:
1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter the FCM token from browser console
6. Click "Test"

## Troubleshooting

### Service Worker Not Registering
- Ensure you're serving the app over HTTPS (or localhost)
- Check browser console for errors
- Verify `firebase-messaging-sw.js` is accessible at the root path

### No FCM Token Received
- Check that notification permissions are granted
- Verify Firebase configuration is correct
- Ensure VAPID key is valid
- Check browser console for errors

### Notifications Not Appearing
- Verify the service worker is active in DevTools > Application > Service Workers
- Check that notification permissions are granted
- Verify backend is sending notifications correctly
- Check FCM token is registered with backend

## Browser Support

Web push notifications are supported in:
- Chrome/Edge (version 50+)
- Firefox (version 44+)
- Safari (version 16+ on macOS 13+)
- Opera (version 37+)

Not supported in:
- iOS Safari (< iOS 16.4)
- Internet Explorer

## Security Notes

- Never commit actual Firebase credentials to version control
- Use environment variables for production deployments
- Implement proper token refresh logic
- Validate all notification payloads on the backend
