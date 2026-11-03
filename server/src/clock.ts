export interface Clock { now(): Date; }
export const systemClock: Clock = { now: () => new Date() };

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function todayBangkok(clock: Clock = systemClock): string {
  const parts = formatter.formatToParts(clock.now());
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function dateString(date: Date): string { return date.toISOString().slice(0, 10); }

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return dateString(value);
}
