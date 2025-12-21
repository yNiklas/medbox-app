import {MedBox, nextDispenseOfBox} from "./MedBox";

export interface MedBockStack {
  id: number;
  name: string;
  boxes: MedBox[];
  orderChanged: boolean;
  danglingMACs: {[mac: string]: number};
}

export function nextDispenseOfStack(stack: MedBockStack): {box: MedBox, time: number} | undefined {
  let minTime = Number.MAX_VALUE;
  let minBox = undefined;
  stack.boxes.forEach(box => {
    const dispense = nextDispenseOfBox(box);
    if (dispense && dispense.time < minTime) {
      minTime = dispense.time;
      minBox = box;
    }
  });
  if (!minBox) {
    return undefined;
  } else {
    return {
      box: minBox,
      time: minTime
    }
  }
}
