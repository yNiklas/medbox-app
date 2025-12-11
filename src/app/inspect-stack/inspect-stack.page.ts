import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard, IonCardContent,
  IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonChip,
  IonContent,
  IonHeader, IonImg, IonItem, IonLabel, IonList, IonRefresher, IonRefresherContent,
  IonSpinner, IonThumbnail,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {ActivatedRoute, Router} from "@angular/router";
import {MedBockStack, nextDispenseOfStack} from "../model/MedBockStack";
import {medBoxStatusString, stackStatusString} from "../model/MedBoxStatus";
import {Backend} from "../services/backend";
import {DateCountdownPipe} from "../pipes/date-countdown-pipe";
import {nextDispenseOfBox} from "../model/MedBox";
import {nextDispenseOfSchedule} from "../model/DispenseSchedule";
import {RefresherCustomEvent} from "@ionic/angular";

@Component({
  selector: 'app-inspect-stack',
  templateUrl: './inspect-stack.page.html',
  styleUrls: ['./inspect-stack.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonChip, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, DateCountdownPipe, IonList, IonItem, IonLabel, IonThumbnail, IonRefresher, IonRefresherContent]
})
export class InspectStackPage  {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private backendService = inject(Backend);
  private readonly stackId: string | undefined = undefined;
  stack: MedBockStack | undefined = undefined;

  constructor() {
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

  protected readonly stackStatusString = stackStatusString;
  protected readonly nextDispenseOfStack = nextDispenseOfStack;
  protected readonly medBoxStatusString = medBoxStatusString;
  protected readonly nextDispenseOfBox = nextDispenseOfBox;
  protected readonly nextDispenseOfSchedule = nextDispenseOfSchedule;
}
