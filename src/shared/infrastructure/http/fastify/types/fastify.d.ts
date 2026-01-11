import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      name: string
      email: string
      emailVerified: boolean
      image?: string | null
      createdAt: Date
      updatedAt: Date
    }
  }
}

