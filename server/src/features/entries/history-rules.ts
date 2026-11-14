import { addDays, dateString } from "../../clock.js";
import { ApiError } from "../../errors.js";

// Versions are loaded with the authorized goal, sorted once, then searched per entry.
// This mirrors targetForDate without an N+1 query or iteration over missing dates.
export function historicalTargets(
  versions: { effectiveFrom: Date; targetMinutes: number }[],
) {
  const ordered = versions
    .map((v) => ({
      date: dateString(v.effectiveFrom),
      minutes: v.targetMinutes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return (date: string) => {
    let lo = 0,
      hi = ordered.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (ordered[mid].date <= date) lo = mid + 1;
      else hi = mid;
    }
    if (!lo)
      throw new ApiError(422, "VALIDATION_ERROR", "วันที่อยู่นอกช่วงเป้าหมาย");
    return ordered[lo - 1].minutes;
  };
}

export function streakFor(achievedDates: string[], today: string) {
  const dates = [...new Set(achievedDates)].sort();
  const result = {
    current: 0,
    best: 0,
    currentStartDate: null as string | null,
    currentEndDate: null as string | null,
    bestStartDate: null as string | null,
    bestEndDate: null as string | null,
  };
  const anchor = dates.includes(today) ? today : addDays(today, -1);
  let start = "",
    previous = "",
    length = 0;
  for (const date of dates) {
    if (!previous || addDays(previous, 1) !== date) {
      start = date;
      length = 0;
    }
    length++;
    if (length > result.best) {
      result.best = length;
      result.bestStartDate = start;
      result.bestEndDate = date;
    }
    if (date === anchor) {
      result.current = length;
      result.currentStartDate = start;
      result.currentEndDate = date;
    }
    previous = date;
  }
  return result;
}
