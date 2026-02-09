import { HttpError } from './http-error'

export class UnauthorizedError extends HttpError {
    constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
        super(401, message, code)
        this.name = 'UnauthorizedError'
        Object.setPrototypeOf(this, UnauthorizedError.prototype)
    }
}

