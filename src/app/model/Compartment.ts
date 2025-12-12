export interface Compartment {
  id: number;
  name: string;
  intervals: DispenseInterval[] | undefined;
  remainingPills: number;
  lastDispenseTime: number | undefined;
  runningOut: boolean;
  potentialErrorMessage?: string;
}

export interface DispenseInterval {
  interval: number;
  start: number;
  pillsToDispense: number;
}

export function nextDispenseOfSchedule(schedule: Compartment): Date | null {
  if (!schedule.intervals || schedule.intervals.length === 0) return null;

  const now = new Date().getTime();
  const minStart = Math.min(...schedule.intervals.map(interval =>
    interval.start + interval.interval*(Math.floor((now-interval.start)/interval.interval)+1)));
  if (isNaN(minStart)) {
    return null;
  } else {
    return new Date(minStart);
  }
}
