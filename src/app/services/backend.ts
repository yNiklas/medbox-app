import {inject, Injectable} from '@angular/core';
import {MedBockStack} from "../model/MedBockStack";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {lastValueFrom, Observable} from "rxjs";
import {ToastController} from "@ionic/angular/standalone";
import {MedBox} from "../model/MedBox";
import {Compartment} from "../model/Compartment";

@Injectable({
  providedIn: 'root',
})
export class Backend {
  private http = inject(HttpClient);
  private toastController = inject(ToastController);

  stacks: MedBockStack[] | undefined = undefined;

  constructor() {
    this.fetchStacks();
  }

  public fetchStacks(): Promise<void> {
    this.stacks = [
      {
        id: 65656,
        name: "Home MedBock",
        boxes: [
          {
            id: 1,
            mac: "AA:BB:CC:DD:EE:01",
            name: "Master Box",
            status: {
              lastSeenAt: Date.now() - 2 * 60 * 1000,
              error: undefined
            },
            compartments: [
              {id: 1, name: "Compartment 1", intervals: undefined, remainingPills: 0, lastDispenseTime: undefined, runningOut: false},
              {id: 2, name: "Compartment 2", intervals: [], remainingPills: 14, lastDispenseTime: Date.now() - 24 * 60 * 60 * 1000, runningOut: false},
              {id: 56, name: "Compartment 3", intervals: [], remainingPills: 7, lastDispenseTime: Date.now() - 12 * 60 * 60 * 1000, runningOut: false, potentialErrorMessage: "Pills are stuck in the funnel, please clean"},
              {id: 76576, name: "Compartment 4", intervals: [], remainingPills: 3, lastDispenseTime: Date.now() - 6 * 60 * 60 * 1000, runningOut: true, potentialErrorMessage: "Not enough pills! Refill 5 pills until Dex 27"}
            ]
          }
        ]
      }
    ];
    return Promise.resolve();


    return lastValueFrom(this.http.get<MedBockStack[]>(environment.backendURL + "/stacks")).then(stacks => {
      this.stacks = stacks;
    });
  }

  public fetchStackById(id: string): Promise<MedBockStack> {
    return new Promise((resolve, reject) => resolve(this.stacks![0]));


    return lastValueFrom(this.http.get<MedBockStack>(environment.backendURL + "/stacks/" + id))
      .catch(err => {
        console.log(err)
        return this.toastController.create({
          message: err.error.message,
          duration: 4000,
          position: "bottom",
          color: "danger"
        }).then(toast => {
          toast.present();
          throw err;
        })
      });
  }

  public assignStack(masterMACAddress: string, boxName: string, stackName: string): Observable<MedBockStack> {
    return this.http.post<MedBockStack>(environment.backendURL + "/stacks", {
      masterMACAddress,
      boxName,
      stackName
    });
  }

  public deleteStack(id: string): Promise<void> {
    return lastValueFrom(this.http.delete<void>(environment.backendURL + "/stacks/" + id))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => toast.present()));
  }

  public renameStack(id: string, newName: string): Promise<MedBockStack | void> {
    return lastValueFrom(this.http.patch<MedBockStack>(environment.backendURL + "/stacks/" + id + "/name", {updatedName: newName}))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => toast.present()));
  }

  public renameBox(boxId: number, newName: string): Promise<MedBox | void> {
    return lastValueFrom(this.http.patch<MedBox>(environment.backendURL + "/boxes/" + boxId + "/name", {updatedName: newName}))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => toast.present()));
  }

  public deleteBox(boxId: number): Promise<void> {
    return lastValueFrom(this.http.delete<void>(environment.backendURL + "/boxes/" + boxId))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => toast.present()));
  }

  public fetchCompartmentById(id: string): Promise<Compartment> {
    return new Promise((resolve, reject) => resolve(this.stacks![0].boxes[0].compartments[0]));


    return lastValueFrom(this.http.get<Compartment>(environment.backendURL + "/compartments/" + id))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => {
        toast.present();
        throw err;
      }));
  }
}
