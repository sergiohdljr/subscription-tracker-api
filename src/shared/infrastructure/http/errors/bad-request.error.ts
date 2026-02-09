import { HttpError } from './http-error'

export class BadRequestError extends HttpError {
    constructor(message: string, details?: unknown) {
        super(400, message, 'BAD_REQUEST', details)
        this.name = 'BadRequestError'
        Object.setPrototypeOf(this, BadRequestError.prototype)
    }
}

