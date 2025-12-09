import {MedBox, nextDispenseOfBox} from "./MedBox";

export interface MedBockStack {
  id: string;
  name: string;
  boxes: MedBox[];
}

export function nextDispenseOfStack(stack: MedBockStack): {box: MedBox, time: number} | undefined {
  let minTime = new Date().getTime();
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
