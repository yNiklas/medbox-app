export interface DispenseSchedule {
  name: string;
  intervals: DispenseInterval[];
}

export interface DispenseInterval {
  interval: number;
  start: number;
}

export function nextDispenseOfSchedule(schedule: DispenseSchedule): Date | null {
  const now = new Date().getTime();
  const minStart = Math.min(...schedule.intervals.map(interval =>
    interval.start + interval.interval*(Math.floor((now-interval.start)/interval.interval)+1)));
  if (isNaN(minStart)) {
    return null;
  } else {
    return new Date(minStart);
  }
}
