# Notification Service Usage Examples

This document provides examples of how to use the notification services in the MedBox app.

## Basic Usage

### 1. Inject the NotificationService

```typescript
import { Component, inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-my-component',
  // ...
})
export class MyComponent {
  private notificationService = inject(NotificationService);
}
```

### 2. Check and Request Permissions

```typescript
async checkAndRequestPermissions() {
  const hasPermission = await this.notificationService.checkPermissions();
  
  if (!hasPermission) {
    const granted = await this.notificationService.requestPermissions();
    if (granted) {
      console.log('Notification permissions granted');
    } else {
      console.log('Notification permissions denied');
    }
  }
}
```

### 3. Send a Pill Dispensed Notification

```typescript
async onPillDispensed(compartment: Compartment, box: MedBox) {
  await this.notificationService.notifyPillDispensed(compartment, box);
}
```

### 4. Send a Pills Running Low Notification

```typescript
async checkPillLevels(compartment: Compartment, box: MedBox) {
  if (compartment.runningOut) {
    await this.notificationService.notifyPillsRunningLow(compartment, box);
  }
}
```

### 5. Schedule a Future Reminder

```typescript
async scheduleReminder(compartment: Compartment, box: MedBox) {
  // Schedule notification for 30 minutes from now
  const dispenseTime = new Date(Date.now() + 30 * 60 * 1000);
  await this.notificationService.scheduleDispenseReminder(
    compartment,
    box,
    dispenseTime
  );
}
```

## Advanced Usage

### Using NotificationIntegrationService

The NotificationIntegrationService is automatically initialized by AppComponent and monitors for pill dispense events. However, you can also manually trigger notifications:

```typescript
import { Component, inject } from '@angular/core';
import { NotificationIntegrationService } from '../services/notification-integration.service';

@Component({
  selector: 'app-my-component',
  // ...
})
export class MyComponent {
  private notificationIntegration = inject(NotificationIntegrationService);

  async onBackendConfirmDispense(compartmentId: number, boxId: number) {
    // Manually trigger notification when backend confirms dispense
    await this.notificationIntegration.onPillDispensed(compartmentId, boxId);
  }
}
```

### Managing Pending Notifications

```typescript
async managePendingNotifications() {
  // Get all pending notifications
  const pending = await this.notificationService.getPendingNotifications();
  console.log(`You have ${pending.length} pending notifications`);
  
  // Cancel all pending notifications
  await this.notificationService.cancelAllNotifications();
}
```

### Example: Compartment Component Integration

```typescript
import { Component, Input, inject } from '@angular/core';
import { Compartment } from '../model/Compartment';
import { MedBox } from '../model/MedBox';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-compartment-details',
  // ...
})
export class CompartmentDetailsComponent {
  @Input() compartment!: Compartment;
  @Input() box!: MedBox;
  
  private notificationService = inject(NotificationService);

  async onManualDispense() {
    // User manually triggered a dispense
    // Send notification
    await this.notificationService.notifyPillDispensed(
      this.compartment,
      this.box
    );
  }

  async checkAndNotifyLowPills() {
    if (this.compartment.runningOut && this.compartment.remainingPills > 0) {
      await this.notificationService.notifyPillsRunningLow(
        this.compartment,
        this.box
      );
    }
  }
}
```

## Integration with Backend

### WebSocket Example

If your backend implements WebSocket for real-time events:

```typescript
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NotificationIntegrationService } from '../services/notification-integration.service';

@Component({
  selector: 'app-root',
  // ...
})
export class AppComponent implements OnInit, OnDestroy {
  private notificationIntegration = inject(NotificationIntegrationService);
  private ws: WebSocket | null = null;

  ngOnInit() {
    this.connectWebSocket();
  }

  ngOnDestroy() {
    if (this.ws) {
      this.ws.close();
    }
  }

  private connectWebSocket() {
    this.ws = new WebSocket('ws://your-backend-url/events');
    
    this.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.event === 'pill_dispensed') {
        await this.notificationIntegration.onPillDispensed(
          data.compartmentId,
          data.boxId
        );
      }
    };
  }
}
```

### HTTP Polling Example (Current Implementation)

The current implementation polls the backend every 30 seconds:

```typescript
// This is already implemented in NotificationIntegrationService
// It automatically checks for changes and sends notifications

// To customize the polling interval, modify the service:
// Change the interval in notification-integration.service.ts
this.pollingInterval = setInterval(() => {
  this.checkForDispenseEvents();
}, 60000); // 60 seconds instead of 30
```

## Testing Notifications

### Test Notification Function

```typescript
async sendTestNotification() {
  const testCompartment: Compartment = {
    id: 999,
    name: 'Test Medication',
    intervals: undefined,
    remainingPills: 10,
    lastDispenseTime: Date.now(),
    runningOut: false,
  };

  const testBox: MedBox = {
    id: 888,
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
```

## Error Handling

Always wrap notification calls in try-catch blocks:

```typescript
async sendNotificationSafely(compartment: Compartment, box: MedBox) {
  try {
    await this.notificationService.notifyPillDispensed(compartment, box);
  } catch (error) {
    console.error('Failed to send notification:', error);
    // Handle error appropriately
    // Show user message, retry, etc.
  }
}
```

## Best Practices

1. **Always Check Permissions First**
   ```typescript
   const hasPermission = await this.notificationService.checkPermissions();
   if (!hasPermission) {
     await this.notificationService.requestPermissions();
   }
   ```

2. **Don't Spam Notifications**
   - Rate limit notifications
   - Batch similar notifications
   - Respect user preferences

3. **Provide Meaningful Content**
   ```typescript
   // Good: Specific information
   await this.notificationService.notifyPillDispensed(compartment, box);
   // "Metformin from Joe's Box has been dispensed"
   
   // Bad: Generic information
   // "Pills dispensed"
   ```

4. **Handle Errors Gracefully**
   - Don't let notification failures break your app
   - Log errors for debugging
   - Provide fallback UI messages

5. **Clean Up Resources**
   ```typescript
   ngOnDestroy() {
     // Stop monitoring when component is destroyed
     this.notificationIntegration.stopMonitoring();
   }
   ```

## Platform-Specific Considerations

### Android
- Notifications work in background and when app is closed
- Users can disable notifications per app in system settings
- Channel importance affects notification behavior

### iOS
- Requires explicit user permission
- Silent notifications require specific configuration
- Time-sensitive notifications require special entitlements

### Web
- Limited notification support
- Requires HTTPS in production
- Desktop browsers have better support than mobile browsers

## Troubleshooting

### Notifications Not Showing

1. Check permissions:
   ```typescript
   const result = await this.notificationService.checkPermissions();
   console.log('Permission status:', result);
   ```

2. Check pending notifications:
   ```typescript
   const pending = await this.notificationService.getPendingNotifications();
   console.log('Pending notifications:', pending);
   ```

3. Verify platform support:
   - Use physical device for testing
   - Check device notification settings
   - Ensure app has permission in system settings

### Notifications Delayed

- Check polling interval in NotificationIntegrationService
- Verify backend is returning updated data
- Consider implementing WebSocket for real-time updates

### Permission Denied

- Request permissions at appropriate time (not immediately on app start)
- Explain why notifications are needed before requesting
- Provide fallback UI for users who deny permissions

## See Also

- [NOTIFICATIONS.md](../NOTIFICATIONS.md) - Complete documentation
- [Capacitor Local Notifications](https://capacitorjs.com/docs/apis/local-notifications)
- [Ionic Framework](https://ionicframework.com/)
