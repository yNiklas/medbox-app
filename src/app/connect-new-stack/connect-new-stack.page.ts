import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList, IonSelect, IonSelectOption,
  IonTitle,
  IonToolbar, LoadingController, ToastController
} from '@ionic/angular/standalone';
import {Esp32WifiBle} from "../services/esp32-wifi-ble";

@Component({
  selector: 'app-connect-new-stack',
  templateUrl: './connect-new-stack.page.html',
  styleUrls: ['./connect-new-stack.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonInput, IonButton, IonSelect, IonSelectOption]
})
export class ConnectNewStackPage implements OnInit {
  readonly WIFI_MAC_RETRIEVE_TIMEOUT = 5_000; // ms
  readonly WIFI_SCAN_TIMEOUT = 10_000; // ms

  private esp32WifiBle = inject(Esp32WifiBle);
  private toastController = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  ssid = "";
  password = "";

  step : "connect" | "wait_for_scan" | "configure" | "done" = "connect";
  connectionSuccessful = false;
  foundSSIDs: string[] = [];
  connectedMACAddress: string | undefined = undefined;

  constructor() { }

  async ngOnInit() {
    await this.esp32WifiBle.initialize();
  }

  async connect() {
    this.connectionSuccessful = await this.esp32WifiBle.connect();
    if (this.connectionSuccessful) {
      // Make timeout to give BLE connection establishing some time
      setTimeout(async () => {
        this.connectedMACAddress = await this.esp32WifiBle.retrieveMACAddress();
      }, 500);
      let loading = await this.loadingCtrl.create({
        message: "Connecting to device...",
        duration: this.WIFI_MAC_RETRIEVE_TIMEOUT+500,
      });
      await loading.present();
      if (!this.connectedMACAddress) {
        this.presentToast("Could not retrieve MAC address!");
        return;
      }
      this.presentToast("Connected successfully!");

      setTimeout(() => {
        this.scan();
      }, 100);
      loading = await this.loadingCtrl.create({
        message: "Scanning for WiFi networks...",
        duration: this.WIFI_SCAN_TIMEOUT+100,
      });
      await loading.present();

      this.step = "configure";
    } else {
      this.presentToast("No conncection established!");
    }
  }

  async scan() {
    const networks = await this.esp32WifiBle.scanWifiNetworks(this.WIFI_SCAN_TIMEOUT);
    this.foundSSIDs = networks.map(n => n.ssid);
    this.foundSSIDs = this.foundSSIDs.filter((value, index) => this.foundSSIDs.indexOf(value) === index); // remove duplicates
  }

  async configure() {
    await this.esp32WifiBle.configureWifi(this.ssid, this.password);
    this.presentToast("Configuration sent!");
  }

  async presentToast(text: string) {
    const toast = await this.toastController.create({
      message: text,
      duration: 1500,
      position: "bottom",
    });

    await toast.present();
  }
}
