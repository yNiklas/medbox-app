import {Component, inject, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonActionSheet,
  IonBadge,
  IonButton,
  IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonChip,
  IonContent,
  IonDatetime,
  IonDatetimeButton, IonFab, IonFabButton,
  IonHeader,
  IonIcon, IonInput, IonItem, IonLabel, IonList,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import {RefresherCustomEvent} from "@ionic/angular";
import {
  Compartment,
  formatDispenseInterval,
  nextDispenseIntervalOfCompartment,
  nextDispenseOfCompartment
} from "../model/Compartment";
import {Backend} from "../services/backend";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {addIcons} from "ionicons";
import {add, alertCircleOutline, ellipsisVerticalOutline, warningOutline} from "ionicons/icons";
import {DateCountdownPipe} from "../pipes/date-countdown-pipe";

@Component({
  selector: 'app-inspect-compartment',
  templateUrl: './inspect-compartment.page.html',
  styleUrls: ['./inspect-compartment.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonRefresher, IonRefresherContent, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, DateCountdownPipe, IonSpinner, IonFab, IonFabButton, IonChip, IonLabel, IonList, IonItem, IonBadge, IonActionSheet, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, IonSelect, IonSelectOption, IonDatetime, IonDatetimeButton]
})
export class InspectCompartmentPage  {
  @ViewChild('renameCompartmentModal') renameCompartmentModal!: IonModal;
  @ViewChild('deleteCompartmentModal') deleteCompartmentModal!: IonModal;
  @ViewChild('editIntervalModal') editIntervalModal!: IonModal;
  @ViewChild('deleteIntervalModal') deleteIntervalModal!: IonModal;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private backendService = inject(Backend);
  private compartmentId: string | undefined = undefined;

  private editIntervalModalEditMode = false;

  compartment: Compartment | undefined = undefined;

  // Properties for modal inputs
  renameCompartmentName: string = '';
  editIntervalValue: number = 1;
  editIntervalUnit: string = 'days';
  editIntervalPills: number = 1;
  editIntervalStartTime: string = new Date().toISOString();
  currentIntervalId: number | undefined = undefined;

  readonly compartmentOptionsSheetActions = [
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

  readonly intervalOptionsSheetActions = [
    {
      text: 'Edit',
      data: {action: "edit"}
    },
    {
      text: "Delete",
      role: "destructive",
      data: {action: "delete"},
    }
  ]

  constructor() {
    addIcons({ellipsisVerticalOutline, add, alertCircleOutline, warningOutline});

    this.compartmentId = this.route.snapshot.paramMap.get("id") || undefined;
    if (!this.compartmentId) {
      this.router.navigate(['/home']);
      return;
    }
    this.fetchCompartment();
  }

  handleRefresh(event: RefresherCustomEvent) {
    if (!this.compartmentId) {
      event.target.complete();
      return;
    }
    this.fetchCompartment().then(() => event.target.complete());
  }

  private fetchCompartment(): Promise<void> {
    if (!this.compartmentId) {
      return Promise.resolve();
    }
    return this.backendService.fetchCompartmentById(this.compartmentId!).then(compartment => {
      this.compartment = compartment;
    });
  }

  handleCompartmentEvent(event: CustomEvent) {
    const action = event.detail.data.action;
    if (action === "rename") {
      this.openRenameCompartmentModal();
    } else if (action === "delete") {
      this.openDeleteCompartmentModal();
    }
  }

  handleIntervalEvent(event: CustomEvent, intervalId: number) {
    const action = event.detail.data.action;
    if (action === "edit") {
      this.openEditIntervalModal(intervalId);
    } else if (action === "delete") {
      this.openDeleteIntervalModal(intervalId);
    }
  }

  openRenameCompartmentModal() {
    this.renameCompartmentName = this.compartment?.name || '';
    this.renameCompartmentModal.present();
  }

  openDeleteCompartmentModal() {
    this.deleteCompartmentModal.present();
  }

  openEditIntervalModal(intervalId: number) {
    this.editIntervalModalEditMode = true;
    this.currentIntervalId = intervalId;
    const interval = this.compartment?.intervals?.find(i => i.id === intervalId);
    if (interval) {
      // Convert milliseconds to appropriate unit
      const hours = interval.interval / (1000 * 60 * 60);
      const days = Math.floor(hours / 24);
      const weeks = Math.floor(days / 7);

      if (weeks >= 1 && days % 7 === 0) {
        this.editIntervalValue = weeks;
        this.editIntervalUnit = 'weeks';
      } else if (days >= 1 && hours % 24 === 0) {
        this.editIntervalValue = days;
        this.editIntervalUnit = 'days';
      } else {
        this.editIntervalValue = hours;
        this.editIntervalUnit = 'hours';
      }

      this.editIntervalPills = interval.pillsToDispense;
      this.editIntervalStartTime = new Date(interval.start).toISOString();
    }
    this.editIntervalModal.present();
  }

  openEditIntervalModalForNew() {
    this.editIntervalModalEditMode = false;
    this.currentIntervalId = undefined;
    this.editIntervalValue = 1;
    this.editIntervalUnit = 'days';
    this.editIntervalPills = 1;
    this.editIntervalStartTime = new Date().toISOString();
    this.editIntervalModal.present();
  }

  openDeleteIntervalModal(intervalId: number) {
    this.currentIntervalId = intervalId;
    this.deleteIntervalModal.present();
  }

  confirmRenameCompartment() {
    if (!this.compartmentId || !this.renameCompartmentName.trim()) {
      return;
    }
    this.backendService.renameCompartment(this.compartmentId, this.renameCompartmentName.trim())
      .then(updatedCompartment => {
        this.renameCompartmentModal.dismiss();
        if (updatedCompartment && this.compartment) {
          this.compartment.name = updatedCompartment.name;
        }
      });
  }

  confirmDeleteCompartment() {
    if (!this.compartmentId) {
      return;
    }
    this.backendService.deleteCompartment(this.compartmentId)
      .then(() => {
        this.deleteCompartmentModal.dismiss();
        this.router.navigate(['/home']);
      });
  }

  confirmEditInterval() {
    // Convert to milliseconds
    let intervalMs = this.editIntervalValue;
    if (this.editIntervalUnit === 'hours') {
      intervalMs = intervalMs * 60 * 60 * 1000;
    } else if (this.editIntervalUnit === 'days') {
      intervalMs = intervalMs * 24 * 60 * 60 * 1000;
    } else if (this.editIntervalUnit === 'weeks') {
      intervalMs = intervalMs * 7 * 24 * 60 * 60 * 1000;
    }

    const startTime = new Date(this.editIntervalStartTime).getTime();

    if (this.editIntervalModalEditMode) {
      if (!this.currentIntervalId) {
        return;
      }

      this.backendService.updateDispenseInterval(
        this.currentIntervalId,
        intervalMs,
        startTime,
        this.editIntervalPills
      ).then(() => {
        this.editIntervalModal.dismiss();
        this.fetchCompartment();
      });
    } else {
      this.backendService.createDispenseInterval(
        intervalMs,
        startTime,
        this.editIntervalPills
      ).then(() => {
        this.editIntervalModal.dismiss();
        this.fetchCompartment();
      });
    }
  }

  confirmDeleteInterval() {
    if (!this.currentIntervalId) {
      return;
    }
    this.backendService.deleteDispenseInterval(this.currentIntervalId)
      .then(() => {
        this.deleteIntervalModal.dismiss();
        this.fetchCompartment();
      });
  }

  protected readonly nextDispenseOfCompartment = nextDispenseOfCompartment;
  protected readonly nextDispenseIntervalOfCompartment = nextDispenseIntervalOfCompartment;
  protected readonly formatDispenseInterval = formatDispenseInterval;
}
