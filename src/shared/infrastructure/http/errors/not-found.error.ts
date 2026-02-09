import { HttpError } from './http-error'

export class NotFoundError extends HttpError {
    constructor(message: string, resource?: string) {
        super(404, message, 'NOT_FOUND', { resource })
        this.name = 'NotFoundError'
        Object.setPrototypeOf(this, NotFoundError.prototype)
    }
}

