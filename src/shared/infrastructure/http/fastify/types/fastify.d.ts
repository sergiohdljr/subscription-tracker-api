import 'fastify';
import { ApiKeyContext } from '@/modules/auth/infrastructure/http/strategies/api-key/api-key.context';
import type { ParsedCSVData } from '@/modules/subscriptions/infrastucture/http/middlewares/validate-csv-file.middleware';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image?: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    apiKey?: ApiKeyContext;
    csvData?: ParsedCSVData;
  }
}
