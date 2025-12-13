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
  id: number;
  interval: number;
  start: number;
  pillsToDispense: number;
}

export function nextDispenseOfInterval(interval: DispenseInterval): Date {
  const now = new Date().getTime();
  const nextTime = interval.start + interval.interval*(Math.floor((now-interval.start)/interval.interval)+1);
  return new Date(nextTime);
}

export function nextDispenseOfCompartment(schedule: Compartment): Date | null {
  if (!schedule.intervals || schedule.intervals.length === 0) return null;

  const minStart = Math.min(...schedule.intervals.map(interval => nextDispenseOfInterval(interval).getTime()));
  if (isNaN(minStart)) {
    return null;
  } else {
    return new Date(minStart);
  }
}

export function nextDispenseIntervalOfCompartment(schedule: Compartment): DispenseInterval | null {
  if (!schedule.intervals || schedule.intervals.length === 0) return null;

  const now = new Date().getTime();
  let nextInterval: DispenseInterval | null = null;
  let minStart = Number.MAX_SAFE_INTEGER;
  for (const interval of schedule.intervals) {
    const nextTime = nextDispenseOfInterval(interval).getTime();
    if (nextTime < minStart) {
      minStart = nextTime;
      nextInterval = interval;
    }
  }
  return nextInterval;
}

export function formatDispenseInterval(interval: DispenseInterval): string {
  const hours = Math.floor(interval.interval / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days >= 1) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  } else {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
}
