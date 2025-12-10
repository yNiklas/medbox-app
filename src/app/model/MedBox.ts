import {MedBoxStatus} from "./MedBoxStatus";
import {DispenseSchedule, nextDispenseOfSchedule} from "./DispenseSchedule";

export interface MedBox {
  id: string;
  mac: string;
  name: string;
  status: MedBoxStatus;
  compartments: DispenseSchedule[]; // One schedule per compartment
}

export function nextDispenseOfBox(box: MedBox): {compartment: DispenseSchedule, time: number} | undefined {
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
