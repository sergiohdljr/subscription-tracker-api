import type { FastifyRequest, FastifyReply } from 'fastify';
import type { BulkCreateSubscriptionsUseCase } from '@/modules/subscriptions/application/use-cases/bulk-create-subscriptions-usecase';
import { BadRequestError, UnauthorizedError } from '@/shared/infrastructure/http/errors';
import { createContextLogger } from '@/shared/infrastructure/logging/logger';
import { parse } from 'csv-parse/sync';

const logger = createContextLogger('bulk-create-subscriptions-controller');

interface CSVRow {
    name: string;
    price: string;
    currency?: string;
    billingCycle: string;
    startDate: string;
    trialEndsAt?: string;
}

export class BulkCreateSubscriptionsController {
    constructor(private readonly bulkCreateUseCase: BulkCreateSubscriptionsUseCase) { }

    async handle(request: FastifyRequest, reply: FastifyReply) {
        const userId = request?.user?.id;

        if (!userId) {
            throw new UnauthorizedError('User not found');
        }

        // Verificar se há arquivo no request
        const data = await request.file();

        if (!data) {
            throw new BadRequestError('CSV file is required');
        }

        // Ler conteúdo do arquivo
        const buffer = await data.toBuffer();
        const csvContent = buffer.toString('utf-8');

        // Parsear CSV
        let rows: CSVRow[];
        try {
            rows = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                cast: false,
            });
        } catch (error) {
            logger.error({ error }, 'Failed to parse CSV');
            throw new BadRequestError('Invalid CSV format', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        if (rows.length === 0) {
            throw new BadRequestError('CSV file is empty');
        }

        // Validar e converter dados
        const subscriptions = rows.map((row, index) => {
            // Validar campos obrigatórios
            if (!row.name || !row.price || !row.billingCycle || !row.startDate) {
                throw new BadRequestError(
                    `Row ${index + 2}: Missing required fields (name, price, billingCycle, startDate)`
                );
            }

            // Validar billingCycle
            const validBillingCycles = ['WEEKLY', 'MONTHLY', 'YEARLY'];
            if (!validBillingCycles.includes(row.billingCycle.toUpperCase())) {
                throw new BadRequestError(
                    `Row ${index + 2}: Invalid billingCycle. Must be one of: ${validBillingCycles.join(', ')}`
                );
            }

            // Converter preço
            const price = parseFloat(row.price);
            if (isNaN(price) || price <= 0) {
                throw new BadRequestError(`Row ${index + 2}: Invalid price. Must be a positive number`);
            }

            // Converter datas
            const startDate = new Date(row.startDate);
            if (isNaN(startDate.getTime())) {
                throw new BadRequestError(`Row ${index + 2}: Invalid startDate format`);
            }

            const trialEndsAt = row.trialEndsAt ? new Date(row.trialEndsAt) : undefined;
            if (trialEndsAt && isNaN(trialEndsAt.getTime())) {
                throw new BadRequestError(`Row ${index + 2}: Invalid trialEndsAt format`);
            }

            return {
                userId,
                name: row.name.trim(),
                price,
                currency: row.currency?.toUpperCase() || 'BRL',
                billingCycle: row.billingCycle.toUpperCase() as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
                startDate,
                trialEndsAt,
            };
        });

        logger.debug({ count: subscriptions.length, userId }, 'Processing bulk create');

        // Executar criação em massa
        const result = await this.bulkCreateUseCase.run(subscriptions);

        return reply.status(201).send({
            success: result.success,
            failed: result.failed,
            total: subscriptions.length,
            createdIds: result.createdIds,
            errors: result.errors,
        });
    }
}

