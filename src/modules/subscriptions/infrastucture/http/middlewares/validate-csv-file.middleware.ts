import type { FastifyRequest, FastifyReply } from 'fastify';
import { BadRequestError } from '@/shared/infrastructure/http/errors';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';
import { parse } from 'csv-parse/sync';
import z from 'zod';

const logger = createContextLogger('validate-csv-file-middleware');

export interface ParsedCSVData {
  subscriptions: Array<z.infer<typeof createSubscriptionSchema>>;
}

export const createSubscriptionSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  currency: z.enum(['BRL', 'USD']).default('BRL'),
  billingCycle: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.coerce.date(),
  trialEndsAt: z.coerce.date().optional(),
});

/**
 * Middleware to validate and parse CSV file from multipart request
 * Attaches parsed CSV data to request object
 */
export async function validateCsvFileMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  // Verificar se há arquivo no request
  const data = await request.file();

  if (!data) {
    throw new BadRequestError('CSV file is required');
  }

  // Validar tipo de arquivo (opcional, mas recomendado)
  const mimetype = data.mimetype;
  if (mimetype && !mimetype.includes('csv') && !mimetype.includes('text/plain')) {
    logger.warn({ mimetype, filename: data.filename }, 'Invalid file type');
    throw new BadRequestError('File must be a CSV file');
  }

  // Ler conteúdo do arquivo
  let buffer: Buffer;
  try {
    buffer = await data.toBuffer();
  } catch (error) {
    logger.error({ error }, 'Failed to read file buffer');
    throw new BadRequestError('Failed to read file');
  }

  const csvContent = buffer.toString('utf-8');

  if (!csvContent || csvContent.trim().length === 0) {
    throw new BadRequestError('CSV file is empty');
  }

  // Parsear CSV
  let rows: Record<string, string>[];
  let subscriptions: Array<z.infer<typeof createSubscriptionSchema>> = [];
  try {
    rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: false,
    });

    subscriptions = rows.map((row) => {
      const transformed = {
        name: row.name,
        price: parseFloat(row.price),
        currency: row.currency as 'BRL' | 'USD' | undefined,
        billingCycle: row.billingCycle as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
        startDate: new Date(row.startDate),
        trialEndsAt: row.trialEndsAt ? new Date(row.trialEndsAt) : undefined,
      };

      const result = createSubscriptionSchema.safeParse(transformed);
      if (!result.success) {
        throw new BadRequestError('Invalid CSV format', {
          error: result.error.flatten().fieldErrors,
        });
      }

      return result.data;
    });
  } catch (error) {
    logger.error({ error }, 'Failed to parse CSV');
    throw new BadRequestError('Invalid CSV format', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  if (rows.length === 0) {
    throw new BadRequestError('CSV file contains no data rows');
  }

  (request as FastifyRequest).csvData = {
    subscriptions,
  };

  logger.debug({ rowCount: rows.length }, 'CSV file parsed successfully');
}
