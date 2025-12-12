import {Component, inject} from '@angular/core';
import {
  IonButton,
  IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon, IonList, IonRefresher, IonRefresherContent, IonSpinner
} from '@ionic/angular/standalone';
import {Router, RouterLink} from "@angular/router";
import {addIcons} from "ionicons";
import {add, logOutOutline} from "ionicons/icons";
import {Backend} from "../services/backend";
import {RefresherCustomEvent} from "@ionic/angular";
import {stackStatusString} from "../model/MedBoxStatus";
import {MedBockStack, nextDispenseOfStack} from "../model/MedBockStack";
import {DateCountdownPipe} from "../pipes/date-countdown-pipe";
import Keycloak from "keycloak-js";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent, RouterLink, IonFab, IonFabButton, IonIcon, IonSpinner, IonList, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonRefresher, IonRefresherContent, DateCountdownPipe, IonButton],
})
export class HomePage {
  private router = inject(Router);
  private keycloak = inject(Keycloak);
  backendService = inject(Backend);

  constructor() {
    addIcons({add, logOutOutline});
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.backendService.fetchStacks().then(() => event.target.complete());
  }

  logout() {
    this.keycloak.logout();
  }

  inspectStack(stack: MedBockStack) {
    this.router.navigate(['/inspect-stack', stack.id], {state: {stack}});
  }

  protected readonly stackStatusString = stackStatusString;
  protected readonly nextDispenseOfStack = nextDispenseOfStack;
}
