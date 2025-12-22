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
    /*
    this.stacks = [
      {
        id: 65656,
        name: "Stack@Home",
        boxes: [
          {
            id: 1,
            mac: "AA:BB:CC:DD:EE:01",
            name: "Joe's Box",
            status: {
              lastSeenAt: Date.now() - 0.5 * 60 * 1000,
              error: undefined
            },
            compartments: [
              {id: 1, name: "Metformin", intervals: undefined, remainingPills: 0, lastDispenseTime: undefined, runningOut: false},
              {id: 2, name: "Albuterol", intervals: [{id: 4, interval: 24*60*60*1000, start: new Date().getTime()-5000, pillsToDispense: 2}, {id: 2, interval: 12*60*60*1000, start: new Date().getTime()-2000, pillsToDispense: 1}], remainingPills: 14, lastDispenseTime: Date.now() - 24 * 60 * 60 * 1000, runningOut: false},
              {id: 56, name: "Metroprolol", intervals: [{id: 5, interval: 24*60*60*1000, start: new Date().getTime()-5000, pillsToDispense: 2}], remainingPills: 7, lastDispenseTime: Date.now() - 12 * 60 * 60 * 1000, runningOut: true},
              {id: 76576, name: "Insulin", intervals: [{id: 7, interval: 24*60*60*1000, start: new Date().getTime()-5000, pillsToDispense: 2}], remainingPills: 3, lastDispenseTime: Date.now() - 6 * 60 * 60 * 1000, runningOut: false}
            ]
          },

          {
            id: 2,
            mac: "AA:BB:CC:DD:EE:02",
            name: "Anna's Box",
            status: {
              lastSeenAt: Date.now() - 0.5 * 60 * 1000, // last seen 5 minutes ago
              error: undefined
            },
            compartments: [
              {
                id: 10,
                name: "Levothyroxine",
                intervals: [
                  {id: 11, interval: 8 * 60 * 60 * 1000, start: new Date().getTime() - 10000, pillsToDispense: 1}
                ],
                remainingPills: 20,
                lastDispenseTime: Date.now() - 8 * 60 * 60 * 1000,
                runningOut: false
              },
              {
                id: 20,
                name: "Metformin",
                intervals: [
                  {id: 21, interval: 48 * 60 * 60 * 1000, start: new Date().getTime() - 3000, pillsToDispense: 3}
                ],
                remainingPills: 2,
                lastDispenseTime: Date.now() - 48 * 60 * 60 * 1000,
                runningOut: false,
                potentialErrorMessage: "Not enough pills! Refill 5 pills until Dec 27"
              },
              {
                id: 30,
                name: "Atorvastatin",
                intervals: undefined,
                remainingPills: 0,
                lastDispenseTime: undefined,
                runningOut: false
              },
              {
                id: 40,
                name: "Amlodipine",
                intervals: [
                  {id: 41, interval: 24 * 60 * 60 * 1000, start: new Date().getTime() - 15000, pillsToDispense: 2},
                  {id: 42, interval: 6 * 60 * 60 * 1000, start: new Date().getTime() - 5000, pillsToDispense: 1}
                ],
                remainingPills: 12,
                lastDispenseTime: Date.now() - 6 * 60 * 60 * 1000,
                runningOut: false
              }
            ]
          }
        ],
        orderChanged: false,
        danglingMACs: {
          "AA:BB:CC:DD:EE:03": 1,
        }
      },
    ];
    return Promise.resolve();
     */


    return lastValueFrom(this.http.get<MedBockStack[]>(environment.backendURL + "/stacks")).then(stacks => {
      this.stacks = stacks;
    });
  }

  public fetchStackById(id: string): Promise<MedBockStack> {
    //return new Promise((resolve, reject) => resolve(this.stacks![0]));


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

  public fetchCompartmentById(id: number): Promise<Compartment> {
    //return new Promise((resolve, reject) => resolve(this.stacks![0].boxes[0].compartments[1]));


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

  public renameCompartment(id: number, newName: string): Promise<Compartment | void> {
    return lastValueFrom(this.http.patch<Compartment>(environment.backendURL + "/compartments/" + id + "/name", {updatedName: newName}))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => toast.present()));
  }

  public deleteCompartment(id: number): Promise<void> {
    return lastValueFrom(this.http.delete<void>(environment.backendURL + "/compartments/" + id))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => toast.present()));
  }

  public createDispenseInterval(compartmentId: number, interval: number, startTime: number, pillsToDispense: number): Promise<void> {
    return lastValueFrom(this.http.post<void>(environment.backendURL + "/dispense-intervals", {
      compartmentId,
      interval,
      startTime,
      pillsToDispense
    }))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => toast.present()));
  }

  public updateDispenseInterval(intervalId: number, interval: number, startTime: number, pillsToDispense: number): Promise<void> {
    return lastValueFrom(this.http.patch<void>(environment.backendURL + "/dispense-intervals/" + intervalId, {
      interval,
      startTime,
      pillsToDispense
    }))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => toast.present()));
  }

  public deleteDispenseInterval(intervalId: number): Promise<void> {
    return lastValueFrom(this.http.delete<void>(environment.backendURL + "/dispense-intervals/" + intervalId))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => toast.present()));
  }

  public onboardDanglingBox(stackId: string, boxName: string, boxMac: string): Promise<MedBox | void> {
    return lastValueFrom(this.http.post<MedBox>(environment.backendURL + "/stacks/" + stackId + "/slave-onboarding", {
      boxName,
      boxMac
    }))
      .catch(err => this.toastController.create({
        message: err.error?.message || err.message,
        duration: 4000,
        position: "bottom",
        color: "danger"
      }).then(toast => toast.present()));
  }
}
