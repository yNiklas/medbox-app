import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent, IonSpinner,
} from '@ionic/angular/standalone';
import {RefresherCustomEvent} from "@ionic/angular";
import {Compartment, nextDispenseOfCompartment} from "../model/Compartment";
import {Backend} from "../services/backend";
import {ActivatedRoute, Router} from "@angular/router";
import {addIcons} from "ionicons";
import {ellipsisVerticalOutline} from "ionicons/icons";
import {DateCountdownPipe} from "../pipes/date-countdown-pipe";

@Component({
  selector: 'app-inspect-compartment',
  templateUrl: './inspect-compartment.page.html',
  styleUrls: ['./inspect-compartment.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonRefresher, IonRefresherContent, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, DateCountdownPipe, IonSpinner]
})
export class InspectCompartmentPage  {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private backendService = inject(Backend);
  private compartmentId: string | undefined = undefined;

  compartment: Compartment | undefined = undefined;

  constructor() {
    addIcons({ellipsisVerticalOutline});
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

  protected readonly nextDispenseOfSchedule = nextDispenseOfCompartment;
}
