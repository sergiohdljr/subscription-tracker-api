import type { BillingCycle } from "../value-objects/billing-cycle";
import type { Money } from "../value-objects/money";

export type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "TRIAL";
export type Currency = "BRL" | "USD";

export class Subscription {
    constructor(
        public readonly id: number,
        public readonly userId: string,
        public name: string,
        public price: Money,
        public currency: Currency,
        public billingCycle: BillingCycle,
        public status: SubscriptionStatus,
        public startDate: Date,
        public nextBillingDate: Date,
        public lastBillingDate: Date | null,
        public renewalNotifiedAt: Date | null,
        public trialEndsAt: Date | null,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) { }


    initialize(today: Date = new Date()) {
        if (this.isTrial()) {
            this.nextBillingDate = this.calculateFirstBillingAfterTrial();
        } else {
            this.nextBillingDate = this.billingCycle.addTo(this.startDate);
            this.status = "ACTIVE";
        }

        this.updatedAt = today;
    }

    private calculateFirstBillingAfterTrial(): Date {
        if (!this.trialEndsAt) {
            throw new Error("Trial end date is required for TRIAL subscriptions");
        }

        return this.billingCycle.addTo(this.trialEndsAt);
    }

    public isActive() {
        return this.status === "ACTIVE"
    }

    public isTrial() {
        return this.status === "TRIAL"
    }

    public isCanceled() {
        return this.status === "INACTIVE"
    }

    public renew() {
        if (!this.isActive()) return;

        this.lastBillingDate = this.nextBillingDate;
        this.nextBillingDate = this.billingCycle.addTo(this.nextBillingDate);
        this.renewalNotifiedAt = null;
        this.updatedAt = new Date();
    }


    public shouldNotify(daysBefore: number, today: Date) {
        if (this.isCanceled()) return false;
        if (this.renewalNotifiedAt) return false;

        const diff =
            (this.nextBillingDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24);

        return diff <= daysBefore && diff >= 0;
    }
}
