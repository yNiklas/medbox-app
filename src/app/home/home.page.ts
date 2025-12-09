import {Component, inject} from '@angular/core';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon, IonList, IonRefresher, IonRefresherContent, IonSpinner
} from '@ionic/angular/standalone';
import {RouterLink} from "@angular/router";
import {addIcons} from "ionicons";
import {add} from "ionicons/icons";
import {Backend} from "../services/backend";
import {RefresherCustomEvent} from "@ionic/angular";
import {stackStatusString} from "../model/MedBoxStatus";
import {nextDispenseOfStack} from "../model/MedBockStack";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent, RouterLink, IonFab, IonFabButton, IonIcon, IonSpinner, IonList, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonRefresher, IonRefresherContent],
})
export class HomePage {
  backendService = inject(Backend);

  constructor() {
    addIcons({add});
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.backendService.fetchStacks().then(() => event.target.complete());
  }

  protected readonly stackStatusString = stackStatusString;
  protected readonly nextDispenseOfStack = nextDispenseOfStack;
}
