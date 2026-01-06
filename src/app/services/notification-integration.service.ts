import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { Backend } from './backend';
import { Compartment } from '../model/Compartment';
import { MedBox } from '../model/MedBox';

/**
 * Service to monitor pill dispensing and trigger notifications
 * This service integrates with the backend to detect when pills are dispensed
 * and uses the NotificationService to send notifications to the user
 * 
 * NOTE: Currently uses polling which can impact battery life. For production,
 * replace with WebSocket or push notifications as documented in NOTIFICATIONS.md
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationIntegrationService {
  private notificationService = inject(NotificationService);
  private backend = inject(Backend);
  private lastDispenseTimes: Map<number, number> = new Map();
  private pollingInterval: any = null;
  
  // Polling interval in milliseconds - can be configured
  // For production, replace polling with WebSocket/push notifications
  private readonly POLL_INTERVAL_MS = 30000; // 30 seconds

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring for pill dispensing
   * This sets up a polling mechanism to check for changes in compartment states
   */
  private async initializeMonitoring(): Promise<void> {
    // Request notification permissions on startup
    await this.notificationService.requestPermissions();

    // Store initial state
    this.updateLastDispenseTimes();

    // Poll every 30 seconds to check for changes
    // NOTE: For production, replace with WebSocket or Server-Sent Events
    // to reduce battery usage and network traffic
    this.pollingInterval = setInterval(() => {
      this.checkForDispenseEvents();
    }, this.POLL_INTERVAL_MS);
  }

  /**
   * Update the stored last dispense times for all compartments
   */
  private updateLastDispenseTimes(): void {
    if (!this.backend.stacks) {
      return;
    }

    this.backend.stacks.forEach((stack) => {
      stack.boxes.forEach((box) => {
        box.compartments.forEach((compartment) => {
          if (compartment.lastDispenseTime) {
            this.lastDispenseTimes.set(compartment.id, compartment.lastDispenseTime);
          }
        });
      });
    });
  }

  /**
   * Check for new dispense events by comparing current state with stored state
   */
  private async checkForDispenseEvents(): Promise<void> {
    if (!this.backend.stacks) {
      return;
    }

    for (const stack of this.backend.stacks) {
      for (const box of stack.boxes) {
        for (const compartment of box.compartments) {
          await this.checkCompartmentForDispense(compartment, box);
        }
      }
    }

    // Update stored times after checking
    this.updateLastDispenseTimes();
  }

  /**
   * Check a specific compartment for new dispense events
   */
  private async checkCompartmentForDispense(
    compartment: Compartment,
    box: MedBox
  ): Promise<void> {
    const lastKnownTime = this.lastDispenseTimes.get(compartment.id);
    const currentTime = compartment.lastDispenseTime;

    // If there's a new dispense event (time has changed)
    if (currentTime && lastKnownTime !== currentTime) {
      await this.notificationService.notifyPillDispensed(compartment, box);
    }

    // Check if pills are running low
    if (compartment.runningOut && compartment.remainingPills > 0) {
      // Only notify if we haven't seen this low state before
      const wasRunningOut = this.wasCompartmentRunningOut(compartment.id);
      if (!wasRunningOut) {
        await this.notificationService.notifyPillsRunningLow(compartment, box);
      }
    }
  }

  /**
   * Track compartments that are running low to avoid duplicate notifications
   */
  private runningOutCompartments = new Set<number>();

  private wasCompartmentRunningOut(compartmentId: number): boolean {
    const wasRunningOut = this.runningOutCompartments.has(compartmentId);
    if (!wasRunningOut) {
      this.runningOutCompartments.add(compartmentId);
    }
    return wasRunningOut;
  }

  /**
   * Manually trigger a notification for a pill dispense event
   * This can be called from the backend when it receives a dispense confirmation
   */
  async onPillDispensed(compartmentId: number, boxId: number): Promise<void> {
    if (!this.backend.stacks) {
      return;
    }

    // Find the compartment and box
    for (const stack of this.backend.stacks) {
      for (const box of stack.boxes) {
        if (box.id === boxId) {
          const compartment = box.compartments.find((c) => c.id === compartmentId);
          if (compartment) {
            await this.notificationService.notifyPillDispensed(compartment, box);
            // Update the stored time
            if (compartment.lastDispenseTime) {
              this.lastDispenseTimes.set(compartment.id, compartment.lastDispenseTime);
            }
          }
          return;
        }
      }
    }
  }

  /**
   * Stop monitoring (cleanup)
   */
  stopMonitoring(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
