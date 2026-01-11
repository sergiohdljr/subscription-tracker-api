export type Currency = "BRL" | "USD";

export class Money {
    private readonly _amount: number;
    private readonly _currency: Currency;

    constructor(amount: number, currency: Currency) {
        if (amount < 0) {
            throw new Error("Money amount cannot be negative");
        }

        this._amount = Number(amount.toFixed(2));
        this._currency = currency;
    }

    get amount(): number {
        return this._amount;
    }

    get currency(): Currency {
        return this._currency;
    }

    equals(other: Money): boolean {
        return (
            this._currency === other.currency &&
            this._amount === other.amount
        );
    }

    add(other: Money): Money {
        this.ensureSameCurrency(other);
        return new Money(this._amount + other.amount, this._currency);
    }

    multiply(multiplier: number): Money {
        if (multiplier < 0) {
            throw new Error("Multiplier cannot be negative");
        }

        return new Money(this._amount * multiplier, this._currency);
    }

    private ensureSameCurrency(other: Money) {
        if (this._currency !== other.currency) {
            throw new Error("Cannot operate with different currencies");
        }
    }
}
