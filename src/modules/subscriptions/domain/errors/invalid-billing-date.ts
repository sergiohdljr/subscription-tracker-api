export class InvalidBillingDateError extends Error {
  constructor() {
    super('Next billing date must be after start date');
    this.name = 'InvalidBillingDateError';
  }
}
