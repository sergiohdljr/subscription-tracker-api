export class User {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly email: string,
        public readonly emailVerified?: boolean,
        public readonly image?: string,
        public readonly createdAt?: string,
        public readonly updatedAt?: string
    ) { }
}