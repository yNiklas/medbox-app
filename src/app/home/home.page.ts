import {Component, inject} from '@angular/core';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon, IonList, IonRefresher, IonRefresherContent, IonSpinner
} from '@ionic/angular/standalone';
import {Router, RouterLink} from "@angular/router";
import {addIcons} from "ionicons";
import {add} from "ionicons/icons";
import {Backend} from "../services/backend";
import {RefresherCustomEvent} from "@ionic/angular";
import {stackStatusString} from "../model/MedBoxStatus";
import {MedBockStack, nextDispenseOfStack} from "../model/MedBockStack";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent, RouterLink, IonFab, IonFabButton, IonIcon, IonSpinner, IonList, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonRefresher, IonRefresherContent],
})
export class HomePage {
  private router = inject(Router);
  backendService = inject(Backend);

  constructor() {
    addIcons({add});
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.backendService.fetchStacks().then(() => event.target.complete());
  }

  inspectStack(stack: MedBockStack) {
    this.router.navigate(['/inspect-stack', stack.id], {state: {stack}});
  }

  protected readonly stackStatusString = stackStatusString;
  protected readonly nextDispenseOfStack = nextDispenseOfStack;
}
