// typescript
import { Injectable } from '@angular/core';
import { BleClient } from '@capacitor-community/bluetooth-le';

// UUIDs aus deinem ESP32-Code
const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcdefab-1234-5678-9abc-def012345678';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');

export interface WifiNetwork {
  ssid: string;
  rssi: number;
}

@Injectable({
  providedIn: 'root',
})
export class Esp32WifiBle {
  private deviceId: string | null = null;
  private notificationsStarted = false;
  private notificationHandlers = new Set<(text: string) => void>();

  /**
   * Muss einmal zu Beginn aufgerufen werden (z.B. in app.component)
   */
  async initialize(): Promise<void> {
    await BleClient.initialize();
    console.log('[BLE] Initialized');
  }

  /**
   * Öffnet den Device-Dialog und verbindet mit deinem ESP32 ("MedBox Controller")
   */
  async connect(): Promise<boolean> {
    if (this.deviceId) {
      try {
        const devices = await BleClient.getConnectedDevices([SERVICE_UUID]);
        if (devices.some((d) => d.deviceId === this.deviceId)) {
          return Promise.resolve(true);
        }
      } catch {
        // Ignorieren, wir versuchen einfach neu
      }
    }

    try {
      const device = await BleClient.requestDevice({
        services: [SERVICE_UUID],
      });

      this.deviceId = device.deviceId;

      await BleClient.connect(this.deviceId, (id) => {
        console.log('[BLE] Disconnected:', id);
        if (this.deviceId === id) {
          this.deviceId = null;
          this.notificationsStarted = false;
          this.notificationHandlers.clear();
        }
      });
    } catch (e) {
      console.error('[BLE] Connection failed', e);
      return Promise.resolve(false);
    }

    console.log('[BLE] Connected to', this.deviceId);
    return Promise.resolve(true);
  }

  private async ensureConnected(): Promise<void> {
    if (!this.deviceId) {
      await this.connect();
    }
  }

  private stringToDataView(text: string): DataView {
    const bytes = textEncoder.encode(text);
    return new DataView(bytes.buffer);
  }

  private dataViewToString(value: DataView): string {
    const bytes = new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    );
    return textDecoder.decode(bytes).trim();
  }

  /**
   * Registriert einen Notification\-Handler und liefert eine Unsubscribe\-Funktion zurück.
   * Intern wird nur einmal startNotifications aufgerufen; eingehende Notifications
   * werden an alle registrierten Handler weitergereicht.
   */
  private async ensureNotifications(
    handler: (text: string) => void,
  ): Promise<() => void> {
    await this.ensureConnected();
    if (!this.deviceId) throw new Error('Device not connected');

    this.notificationHandlers.add(handler);
    const unsubscribe = () => {
      this.notificationHandlers.delete(handler);
    };

    if (this.notificationsStarted) {
      return unsubscribe;
    }

    await BleClient.startNotifications(
      this.deviceId,
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (value) => {
        const text = this.dataViewToString(value);
        if (!text) return;
        // Router: sende an alle registrierten Handler
        this.notificationHandlers.forEach((h) => {
          try {
            h(text);
          } catch (e) {
            console.error('[BLE] Notification handler error', e);
          }
        });
      },
    );

    this.notificationsStarted = true;
    console.log('[BLE] Notifications started');
    return unsubscribe;
  }

  /**
   * Asynchrones Scannen nach WiFi-Netzwerken.
   * Triggert SCAN_WIFI auf dem ESP32 und sammelt alles zwischen "Begin Wifi" und "End Wifi".
   */
  async scanWifiNetworks(timeoutMs = 10000): Promise<WifiNetwork[]> {
    await this.ensureConnected();
    if (!this.deviceId) throw new Error('Device not connected');

    return new Promise<WifiNetwork[]>(async (resolve) => {
      const networks: WifiNetwork[] = [];
      let collecting = false;
      let timer: any;

      const unsubscribe = await this.ensureNotifications((text) => {
        if (text === 'Begin Wifi') {
          collecting = true;
          networks.length = 0;
          return;
        }

        if (text === 'End Wifi') {
          collecting = false;
          if (timer) clearTimeout(timer);
          unsubscribe();
          resolve(networks);
          return;
        }

        if (!collecting) {
          return;
        }

        if (text.startsWith('SSID:')) {
          try {
            const parts = text.split(',');
            const ssidPart = parts[0].slice('SSID:'.length);
            const rssiPart = parts[1].slice('RSSI:'.length);
            networks.push({
              ssid: ssidPart,
              rssi: Number.parseInt(rssiPart, 10),
            });
          } catch (e) {
            console.warn('[BLE] Failed to parse network:', text, e);
          }
        }
      });

      timer = setTimeout(() => {
        console.warn('[BLE] scanWifiNetworks timeout');
        unsubscribe();
        resolve(networks);
      }, timeoutMs);

      // ESP32 anstoßen
      await BleClient.write(
        this.deviceId!,
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        this.stringToDataView('SCAN_WIFI'),
      );
    });
  }

  async retrieveMACAddress(timeout = 5000): Promise<string> {
    await this.ensureConnected();
    if (!this.deviceId) throw new Error('Device not connected');

    return new Promise<string>(async (resolve) => {
      let timer: any;

      const unsubscribe = await this.ensureNotifications((text) => {
        if (text.startsWith('MAC:')) {
          if (timer) clearTimeout(timer);
          unsubscribe();
          const macAddress = text.slice('MAC:'.length).trim();
          resolve(macAddress);
        }
      });

      timer = setTimeout(() => {
        console.warn('[BLE] retrieveMACAddress timeout');
        unsubscribe();
        resolve('');
      }, timeout);

      await BleClient.write(
        this.deviceId!,
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        this.stringToDataView('GET_MAC'),
      );
    });
  }

  /**
   * Schickt WLAN\-Konfiguration:
   * 1) "CON_WIFI"
   * 2) "S" + SSID
   * 3) "P" + Passwort
   *
   * Der ESP32 speichert das und macht ESP.restart().
   */
  async configureWifi(ssid: string, password: string, timeoutMs = 10000): Promise<boolean> {
    if (!ssid || !password) {
      throw new Error('Missing SSID or password');
    }

    await this.ensureConnected();
    if (!this.deviceId) throw new Error('Device not connected');

    return new Promise<boolean>(async (resolve) => {
      let finished = false;
      let timer: any;

      const finish = (value: boolean) => {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        if (unsubscribe) unsubscribe();
        resolve(value);
      };

      const unsubscribe = await this.ensureNotifications((text) => {
        console.log('[BLE] Notify in configureWifi:', text);

        if (text === 'SUCCESS') {
          finish(true);
        } else if (text === 'FAILED') {
          finish(false);
        }
      });

      // timeout → FAIL
      timer = setTimeout(() => {
        console.warn('[BLE] configureWifi timeout');
        finish(false);
      }, timeoutMs);

      // 1) Send CON_WIFI
      console.log('[BLE] Sending CON_WIFI');
      await BleClient.write(
        this.deviceId!,
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        this.stringToDataView('CON_WIFI'),
      );

      await new Promise((res) => setTimeout(res, 200));

      // 2) SSID
      console.log('[BLE] Sending SSID');
      await BleClient.write(
        this.deviceId!,
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        this.stringToDataView('S' + ssid),
      );

      await new Promise((res) => setTimeout(res, 200));

      // 3) Password
      console.log('[BLE] Sending password');
      await BleClient.write(
        this.deviceId!,
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        this.stringToDataView('P' + password),
      );
    });
  }
}
