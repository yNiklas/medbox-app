import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateCountdown'
})
export class DateCountdownPipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined): string {
    if (!value) return "None";

    const target = new Date(value).getTime();
    const now = Date.now();
    const diffMs = target - now;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 1) {
      return `In ${diffDays} days`;
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours >= 1) {
      return `In ${diffHours} hours`;
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes >= 1) {
      return `In ${diffMinutes} minutes`;
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    return `In ${diffSeconds}s`;
  }
}
