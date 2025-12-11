import {inject, Injectable} from '@angular/core';
import {MedBockStack} from "../model/MedBockStack";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {lastValueFrom, Observable, Subscription} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class Backend {
  private http = inject(HttpClient);

  stacks: MedBockStack[] | undefined = undefined;

  constructor() {
    this.fetchStacks();
  }

  public fetchStacks(): Promise<void> {
    return lastValueFrom(this.http.get<MedBockStack[]>(environment.backendURL + "/stacks")).then(stacks => {
      this.stacks = stacks;
    });
  }

  public fetchStackById(id: string): Promise<MedBockStack> {
    // Mock-impl
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          id: 'stack1',
          name: 'MedBox Stack DEX',
          boxes: [
            {
              id: 'box1',
              name: 'Box 1',
              mac: "AC:DE:48:00:11:22",
              status: {lastSeenAt: new Date().getTime() - 30 * 1000, error: undefined},
              compartments: [
                {
                  name: 'Compartment 1',
                  intervals: [{
                    start: new Date().getTime() - 10000,
                    interval: 60 * 1000
                  }]
                },
                {
                  name: 'Compartment 2',
                  intervals: [{
                    start: new Date().getTime() - 20000,
                    interval: 120 * 1000
                  }]
                },
                {
                  name: 'Compartment 3',
                  intervals: [{
                    start: new Date().getTime() - 30000,
                    interval: 180 * 1000
                  }]
                },
                {
                  name: 'Compartment 4',
                  intervals: [{
                    start: new Date().getTime() - 40000,
                    interval: 240 * 1000
                  }]
                }
              ]
            }]
        });
      }, 2000);
    });
  }

  public assignStack(masterMACAddress: string, boxName: string, stackName: string): Observable<void> {
    return this.http.post<void>(environment.backendURL + "/stacks", {
      masterMACAddress,
      boxName,
      stackName
    });
  }
}
