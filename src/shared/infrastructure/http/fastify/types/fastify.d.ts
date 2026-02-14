import 'fastify';
import { ApiKeyContext } from '@/modules/auth/infrastructure/http/strategies/api-key/api-key.context';

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
  }
}
