export class BillingCycle {
  constructor(
    private readonly value: "WEEKLY" | "MONTHLY" | "YEARLY"
  ) { }

  static weekly() {
    return new BillingCycle("WEEKLY");
  }

  static monthly() {
    return new BillingCycle("MONTHLY");
  }

  static yearly() {
    return new BillingCycle("YEARLY");
  }

  nextDate(from: Date): Date {
    const date = new Date(from);

    if (this.value === "WEEKLY") {
      date.setDate(date.getDate() + 7);
    }

    if (this.value === "MONTHLY") {
      date.setMonth(date.getMonth() + 1);
    }

    if (this.value === "YEARLY") {
      date.setFullYear(date.getFullYear() + 1);
    }

    return date;
  }

  toString() {
    return this.value;
  }
}

