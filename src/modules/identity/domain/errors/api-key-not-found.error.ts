export class ApiKeyNotFoundError extends Error {
    constructor(id?: string) {
        super(id ? `API Key with id ${id} not found` : "API Key not found");
        this.name = "ApiKeyNotFoundError";
    }
}

