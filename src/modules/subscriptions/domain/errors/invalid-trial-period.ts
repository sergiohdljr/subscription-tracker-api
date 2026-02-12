export class InvalidTrialPeriodError extends Error {
  constructor() {
    super('Trial end date must be after start date');
    this.name = 'InvalidTrialPeriodError';
  }
}
