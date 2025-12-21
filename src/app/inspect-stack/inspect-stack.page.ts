import {Component, inject, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonActionSheet,
  IonButton,
  IonButtons,
  IonCard, IonCardContent,
  IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonChip,
  IonContent,
  IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonModal, IonRefresher, IonRefresherContent,
  IonSpinner, IonThumbnail,
  IonTitle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import {ActivatedRoute, Router} from "@angular/router";
import {MedBockStack, nextDispenseOfStack} from "../model/MedBockStack";
import {medBoxStatusString, stackStatusString} from "../model/MedBoxStatus";
import {Backend} from "../services/backend";
import {DateCountdownPipe} from "../pipes/date-countdown-pipe";
import {MedBox, nextDispenseOfBox} from "../model/MedBox";
import {nextDispenseOfCompartment} from "../model/Compartment";
import {RefresherCustomEvent} from "@ionic/angular";
import {addIcons} from "ionicons";
import {alertCircleOutline, ellipsisVerticalOutline, warningOutline} from "ionicons/icons";

@Component({
  selector: 'app-inspect-stack',
  templateUrl: './inspect-stack.page.html',
  styleUrls: ['./inspect-stack.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonChip, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, DateCountdownPipe, IonList, IonItem, IonLabel, IonThumbnail, IonRefresher, IonRefresherContent, IonIcon, IonButton, IonActionSheet, IonModal, IonButtons, IonInput]
})
export class InspectStackPage  {
  @ViewChild('renameBoxModal') renameBoxModal!: IonModal;
  @ViewChild('deleteBoxModal') deleteBoxModal!: IonModal;
  @ViewChild('renameStackModal') renameStackModal!: IonModal;
  @ViewChild('deleteStackModal') deleteStackModal!: IonModal;
  @ViewChild('onboardDanglingBoxModal') onboardDanglingBoxModal!: IonModal;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private backendService = inject(Backend);
  private toastController = inject(ToastController);
  private stackId: string | undefined = undefined;

  stack: MedBockStack | undefined = undefined;

  // Properties for modal inputs
  renameBoxName: string = '';
  renameStackName: string = '';
  currentBoxId: number | undefined = undefined;
  onboardBoxName: string = '';
  onboardBoxMac: string = '';

  readonly boxOptionsSheetActions = [
    {
      text: 'Rename',
      data: {action: "rename"}
    },
    {
      text: "Delete",
      role: "destructive",
      data: {action: "delete"},
    }
  ]

  readonly stackOptionsSheetActions = [
    {
      text: 'Rename',
      data: {action: "rename"}
    },
    {
      text: "Delete",
      role: "destructive",
      data: {action: "delete"},
    }
  ]

  constructor() {
    addIcons({warningOutline, alertCircleOutline, ellipsisVerticalOutline});

    this.stackId = this.route.snapshot.paramMap.get("id") || undefined;
    if (!this.stackId) {
      this.router.navigate(["/home"]);
      return;
    }
    this.fetchStack();
  }

  handleRefresh(event: RefresherCustomEvent) {
    if (!this.stackId) {
      event.target.complete();
      return;
    }
    this.fetchStack().then(() => event.target.complete());
  }

  private fetchStack(): Promise<void | MedBockStack> {
    if (!this.stackId) {
      return Promise.resolve();
    }
    return this.backendService.fetchStackById(this.stackId)
      .catch(() => this.router.navigate(["/home"]))
      .then(stack => this.stack = stack as MedBockStack);
  }

  getBoxesToShow(): (MedBox | string)[] {
    if (!this.stack) {
      return [];
    }

    const boxesIncludeDangling: (MedBox | string)[] = [...this.stack.boxes];
    for (const mac in this.stack.danglingMACs) {
      const index = this.stack.danglingMACs[mac];
      boxesIncludeDangling.splice(index, 0, mac);
    }
    return boxesIncludeDangling;
  }

  handleBoxEvent(event: CustomEvent, boxId: number) {
    const action = event.detail.data.action;
    if (action === "rename") {
      this.openRenameBoxModal(boxId);
    } else if (action === "delete") {
      this.openDeleteBoxModal(boxId);
    }
  }

  handleStackEvent(event: CustomEvent) {
    const action = event.detail.data.action;
    if (action === "rename") {
      this.openRenameStackModal();
    } else if (action === "delete") {
      this.openDeleteStackModal();
    }
  }

  openRenameBoxModal(boxId: number) {
    this.currentBoxId = boxId;
    const box = this.stack?.boxes.find(b => b.id === boxId);
    this.renameBoxName = box?.name || '';
    this.renameBoxModal.present();
  }

  openDeleteBoxModal(boxId: number) {
    this.currentBoxId = boxId;
    this.deleteBoxModal.present();
  }

  openRenameStackModal() {
    this.renameStackName = this.stack?.name || '';
    this.renameStackModal.present();
  }

  openDeleteStackModal() {
    this.deleteStackModal.present();
  }

  confirmRenameBox() {
    if (!this.stackId || !this.currentBoxId || !this.renameBoxName.trim()) {
      return;
    }
    this.backendService.renameBox(this.currentBoxId, this.renameBoxName.trim())
      .then(updatedBox => {
        this.renameBoxModal.dismiss();
        if (updatedBox && this.stack) {
          this.stack.boxes.find(b => b.id === this.currentBoxId)!.name = updatedBox?.name;
        }
      });
  }

  confirmDeleteBox() {
    if (!this.stackId || !this.currentBoxId) {
      return;
    }
    this.backendService.deleteBox(this.currentBoxId)
      .then(() => {
        this.deleteBoxModal.dismiss();
        this.fetchStack();
      });
  }

  confirmRenameStack() {
    if (!this.stackId || !this.renameStackName.trim()) {
      return;
    }
    this.backendService.renameStack(this.stackId, this.renameStackName.trim())
      .then(updatedStack => {
        this.renameStackModal.dismiss();
        if (updatedStack && this.stack) {
          this.stack.name = updatedStack?.name;
        }
      });
  }

  confirmDeleteStack() {
    if (!this.stackId) {
      return;
    }
    this.backendService.deleteStack(this.stackId)
      .then(() => {
        this.deleteStackModal.dismiss();
        this.router.navigate(['/home']);
      });
  }

  openOnboardDanglingBoxModal(mac: string) {
    this.onboardBoxMac = mac;
    this.onboardBoxName = '';
    this.onboardDanglingBoxModal.present();
  }

  confirmOnboardDanglingBox() {
    if (!this.stackId || !this.onboardBoxMac || !this.onboardBoxName.trim()) {
      this.toastController.create({
        message: 'Please provide a valid box name',
        duration: 3000,
        position: "bottom",
        color: "warning"
      }).then(toast => toast.present());
      return;
    }
    this.backendService.onboardDanglingBox(this.stackId, this.onboardBoxName.trim(), this.onboardBoxMac)
      .then(() => {
        this.onboardDanglingBoxModal.dismiss();
        this.fetchStack();
      });
  }

  inspectCompartment(id: number){
    this.router.navigate(['/inspect-compartment', id]);
  }

  protected readonly stackStatusString = stackStatusString;
  protected readonly nextDispenseOfStack = nextDispenseOfStack;
  protected readonly medBoxStatusString = medBoxStatusString;
  protected readonly nextDispenseOfBox = nextDispenseOfBox;
  protected readonly nextDispenseOfSchedule = nextDispenseOfCompartment;
}
