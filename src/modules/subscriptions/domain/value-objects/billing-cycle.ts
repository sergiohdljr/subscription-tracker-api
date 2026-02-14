export type BillingCycleType = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export class BillingCycle {
  private readonly value: BillingCycleType;

  constructor(value: BillingCycleType) {
    this.value = value;
  }

  getValue() {
    return this.value;
  }

  addTo(date: Date): Date {
    const result = new Date(date);

    switch (this.value) {
      case 'WEEKLY':
        result.setDate(result.getDate() + 7);
        break;

      case 'MONTHLY':
        result.setMonth(result.getMonth() + 1);
        break;

      case 'YEARLY':
        result.setFullYear(result.getFullYear() + 1);
        break;
    }

    return result;
  }
}
