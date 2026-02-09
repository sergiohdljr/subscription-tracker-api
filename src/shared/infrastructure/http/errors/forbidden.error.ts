import { HttpError } from './http-error'

export class ForbiddenError extends HttpError {
    constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
        super(403, message, code)
        this.name = 'ForbiddenError'
        Object.setPrototypeOf(this, ForbiddenError.prototype)
    }
}

