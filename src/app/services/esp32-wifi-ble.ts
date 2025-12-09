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
    // Falls schon connected, einfach raus
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
        // optional nameFilter, wenn du willst:
        // name: 'MedBox Controller',
      });

      this.deviceId = device.deviceId;

      await BleClient.connect(this.deviceId, (id) => {
        console.log('[BLE] Disconnected:', id);
        if (this.deviceId === id) {
          this.deviceId = null;
          this.notificationsStarted = false;
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

  /**
   * Text -> DataView für das Write
   */
  private stringToDataView(text: string): DataView {
    const bytes = textEncoder.encode(text);
    return new DataView(bytes.buffer);
  }

  /**
   * DataView -> string für Notifications
   */
  private dataViewToString(value: DataView): string {
    const bytes = new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    );
    return textDecoder.decode(bytes).trim();
  }

  /**
   * Startet Notifications einmal und übergibt die Raws an den Callback
   */
  private async ensureNotifications(
    handler: (text: string) => void,
  ): Promise<void> {
    await this.ensureConnected();
    if (!this.deviceId) throw new Error('Device not connected');

    if (this.notificationsStarted) {
      // Hier bewusst NICHT stop/start, damit wir einmal global Notifications haben.
      return;
    }

    await BleClient.startNotifications(
      this.deviceId,
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (value) => {
        const text = this.dataViewToString(value);
        if (!text) return;
        console.log('[BLE] Notify:', text);
        handler(text);
      },
    );

    this.notificationsStarted = true;
    console.log('[BLE] Notifications started');
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

      const timer = setTimeout(() => {
        console.warn('[BLE] scanWifiNetworks timeout');
        resolve(networks); // ggf. Teilmenge zurückgeben
      }, timeoutMs);

      await this.ensureNotifications((text) => {
        if (text === 'Begin Wifi') {
          collecting = true;
          networks.length = 0;
          return;
        }

        if (text === 'End Wifi') {
          collecting = false;
          clearTimeout(timer);
          resolve(networks);
          return;
        }

        if (!collecting) {
          // z.B. deine MAC-Adress-Notifications aus loop()
          return;
        }

        if (text.startsWith('SSID:')) {
          try {
            // Format: "SSID:Name,RSSI:-60"
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
      const timer = setTimeout(() => {
        console.warn("[BLE] retrieveMACAddress timeout");
        resolve('');
      }, timeout);

      await this.ensureNotifications((text) => {
        if (text.startsWith("MAC:")) {
          clearTimeout(timer);
          const macAddress = text.slice("MAC:".length).trim();
          resolve(macAddress);
        }
      });

      await BleClient.write(
        this.deviceId!,
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        this.stringToDataView('GET_MAC'),
      );
    });
  }

  /**
   * Schickt WLAN-Konfiguration:
   * 1) "CON_WIFI"
   * 2) "S" + SSID
   * 3) "P" + Passwort
   *
   * Der ESP32 speichert das und macht ESP.restart().
   */
  async configureWifi(ssid: string, password: string): Promise<void> {
    if (!ssid || !password) {
      throw new Error('SSID und Passwort dürfen nicht leer sein.');
    }

    await this.ensureConnected();
    if (!this.deviceId) throw new Error('Device not connected');

    // 1) CON_WIFI
    console.log('[BLE] Sending CON_WIFI');
    await BleClient.write(
      this.deviceId,
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      this.stringToDataView('CON_WIFI'),
    );

    // kleine Pause, damit dein state = 1 greifen kann
    await new Promise((res) => setTimeout(res, 200));

    // 2) SSID
    console.log('[BLE] Sending SSID');
    await BleClient.write(
      this.deviceId,
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      this.stringToDataView('S' + ssid),
    );

    await new Promise((res) => setTimeout(res, 200));

    // 3) Passwort
    console.log('[BLE] Sending password');
    await BleClient.write(
      this.deviceId,
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      this.stringToDataView('P' + password),
    );

    console.log(
      '[BLE] WiFi config sent, ESP32 sollte jetzt gleich neu starten.',
    );
  }
}
