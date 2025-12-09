import {MedBockStack} from "./MedBockStack";

export interface MedBoxStatus {
  lastSeenAt: number;
  error: string | undefined;
}

export function medBoxStatusString(status: MedBoxStatus): string {
  if (status.error) {
    return `Error: ${status.error}`;
  } else if (new Date().getTime() - status.lastSeenAt < 60 * 1000) {
    return "Online";
  } else {
    return "Last seen " + new Date(status.lastSeenAt).toLocaleString();
  }
}

export function stackStatusString(stack: MedBockStack): string {
  const boxStatuses = stack.boxes.map(box => medBoxStatusString(box.status));
  if (boxStatuses.every(status => status === "Online")) {
    return "Online";
  } else if (boxStatuses.some(status => status.startsWith("Error"))) {
    return "Error";
  } else {
    const oldestSeen = Math.min(...stack.boxes.map(box => box.status.lastSeenAt));
    return "Last seen " + new Date(oldestSeen).toLocaleString();
  }
}
