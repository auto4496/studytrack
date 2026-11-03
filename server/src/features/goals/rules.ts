import { ApiError } from '../../errors.js';

export function validateGoalRules(_input: { dailyTargetMinutes: number; startDate: string }, _template: { minMinutes: number; maxMinutes: number }, _today: string): void {
  throw new ApiError(501, 'NOT_IMPLEMENTED', 'Goal rules are not implemented yet.');
}
