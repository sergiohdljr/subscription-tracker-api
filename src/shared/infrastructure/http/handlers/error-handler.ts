import type { FastifyError, FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { HttpError } from '../errors/http-error';
import { mapDomainErrorToHttp, formatErrorResponse } from '../mappers/error-to-http.mapper';
import type { ErrorResponse } from '../types/error-response';
import { createContextLogger } from '../../logging/logger';

const logger = createContextLogger('error-handler');

export function setupErrorHandler(server: FastifyInstance) {
  server.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (error.validation) {
      const response: ErrorResponse = {
        error: 'ValidationError',
        message: 'Request validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          errors: error.validation.map((err) => ({
            field: err.instancePath || (err.params as any)?.missingProperty || 'unknown',
            message: err.message || 'Invalid value',
          })),
        },
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      return reply.status(400).send(response);
    }

    if (error instanceof HttpError) {
      const response = formatErrorResponse(error, request);
      return reply.status(error.statusCode).send(response);
    }

    if (error instanceof Error) {
      const httpError = mapDomainErrorToHttp(error, request);
      const response = formatErrorResponse(httpError, request);
      return reply.status(httpError.statusCode).send(response);
    }

    const response: ErrorResponse = {
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (process.env.NODE_ENV !== 'PRODUCTION') {
      logger.error(
        {
          err: error,
          url: request.url,
          method: request.method,
        },
        'Unhandled error'
      );
      response.details = {
        message: (error as Error)?.message ?? 'An unexpected error occurred',
        stack: (error as Error)?.stack ?? undefined,
      };
    }

    return reply.status(500).send(response);
  });

  // Handler para erros não capturados (404, etc)
  server.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const response: ErrorResponse = {
      error: 'NotFoundError',
      message: `Route ${request.method} ${request.url} not found`,
      code: 'ROUTE_NOT_FOUND',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    reply.status(404).send(response);
  });
}
