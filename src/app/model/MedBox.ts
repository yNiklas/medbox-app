import {MedBoxStatus} from "./MedBoxStatus";
import {Compartment, nextDispenseOfSchedule} from "./Compartment";

export interface MedBox {
  id: number;
  mac: string;
  name: string;
  status: MedBoxStatus;
  compartments: Compartment[]; // One schedule per compartment
}

export function nextDispenseOfBox(box: MedBox): {compartment: Compartment, time: number} | undefined {
  let minTime = Number.MAX_VALUE;
  let minSchedule = undefined;
  box.compartments.forEach(schedule => {
    const dispenseTime = nextDispenseOfSchedule(schedule);
    if (dispenseTime && dispenseTime.getTime() < minTime) {
      minTime = dispenseTime.getTime();
      minSchedule = schedule;
    }
  });
  if (!minSchedule) {
    return undefined;
  } else {
    return {
      compartment: minSchedule,
      time: minTime
    }
  }
}
