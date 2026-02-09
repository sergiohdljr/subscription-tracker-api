import { FastifyRequest } from 'fastify'
import { HttpError, BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError, InternalServerError } from '../errors'
import { ApiKeyExpiredError, ApiKeyRevokedError, InsufficientScopeError, ApiKeyNotFoundError } from '@/modules/identity/domain/errors'
import { UserNotFoundError } from '@/modules/user/domain/errors'
import { InvalidBillingDateError, InvalidTrialPeriodError, InvalidSubscriptionNameError } from '@/modules/subscriptions/domain/errors'
import { ErrorResponse } from '../types/error-response'
import { createContextLogger } from '../../logging/logger'

const logger = createContextLogger('error-mapper')

export function mapDomainErrorToHttp(error: Error, request?: FastifyRequest): HttpError {
    // Erros de API Key
    if (error instanceof ApiKeyExpiredError) {
        return new UnauthorizedError('API key has expired', 'API_KEY_EXPIRED')
    }

    if (error instanceof ApiKeyRevokedError) {
        return new UnauthorizedError('API key has been revoked', 'API_KEY_REVOKED')
    }

    if (error instanceof ApiKeyNotFoundError) {
        return new UnauthorizedError('Invalid API key', 'API_KEY_NOT_FOUND')
    }

    if (error instanceof InsufficientScopeError) {
        return new ForbiddenError(error.message, 'INSUFFICIENT_SCOPE')
    }

    // Erros de domínio - Validação
    if (error instanceof InvalidBillingDateError ||
        error instanceof InvalidTrialPeriodError ||
        error instanceof InvalidSubscriptionNameError) {
        return new BadRequestError(error.message, { domainError: error.name })
    }

    // Erros de domínio - Não encontrado
    if (error instanceof UserNotFoundError) {
        return new NotFoundError('User not found', 'user')
    }

    // Erros HTTP já mapeados
    if (error instanceof HttpError) {
        return error
    }

    logger.warn({
        err: error,
        name: error.name,
        url: request?.url,
        method: request?.method
    }, 'Unmapped error detected')

    return new InternalServerError('An unexpected error occurred')
}

export function formatErrorResponse(
    httpError: HttpError,
    request?: FastifyRequest
): ErrorResponse {
    return {
        error: httpError.name,
        message: httpError.message,
        code: httpError.code,
        details: httpError.details,
        timestamp: new Date().toISOString(),
        path: request?.url
    }
}

