export class InvalidSubscriptionNameError extends Error {
  constructor() {
    super('Subscription name is invalid');
    this.name = 'InvalidSubscriptionNameError';
  }
}
