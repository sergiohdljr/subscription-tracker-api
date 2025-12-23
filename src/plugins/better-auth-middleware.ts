import { FastifyRequest, FastifyReply } from "fastify"
import { auth } from "../lib/auth"

export async function betterAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
    // Skip authentication for auth routes and documentation routes
    if (request.url.startsWith('/api/auth/') || 
        request.url.startsWith('/docs') ||
        request.url.startsWith('/documentation')) {
        return
    }

    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })
        if (!session) {
            return reply.status(401).send({
                error: 'Unauthorized'
            })
        }

        request.user = session.user

    } catch (error) {
        reply.status(500).send({
            error: 'Internal server error'
        })
    }
}