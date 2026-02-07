import { RevokeApiKeyUseCase } from '@/modules/identity/application/use-cases/revoke-api-key-usecase'
import { InMemoryApiKeyRepository } from '@/modules/identity/infrastructure/repositories/in-memory-api-key-repository'
import { ApiKey } from '@/modules/identity/domain/entities/api-key'
import { ApiKeyNotFoundError } from '@/modules/identity/domain/errors/api-key-not-found.error'

function makeApiKey(params: {
    id?: string
    hash?: string
    owner?: string
    status?: 'active' | 'revoked'
}): ApiKey {
    const now = new Date('2024-01-01T00:00:00.000Z')
    return new ApiKey(
        params.id ?? 'api-key-1',
        params.hash ?? 'hash-123',
        params.owner ?? 'user-1',
        params.status ?? 'active',
        null,
        now,
        null
    )
}

describe('RevokeApiKeyUseCase', () => {
    let useCase: RevokeApiKeyUseCase
    let repository: InMemoryApiKeyRepository

    beforeEach(() => {
        repository = new InMemoryApiKeyRepository()
        useCase = new RevokeApiKeyUseCase(repository)
    })

    it('should revoke an active API key', async () => {
        const apiKey = makeApiKey({ id: 'key-1', status: 'active' })
        await repository.save(apiKey)

        const result = await useCase.execute({ apiKeyId: 'key-1' })

        expect(result.id).toBe('key-1')
        expect(result.status).toBe('revoked')

        const revoked = await repository.findById('key-1')
        expect(revoked?.getStatus()).toBe('revoked')
    })

    it('should throw error if API key does not exist', async () => {
        await expect(
            useCase.execute({ apiKeyId: 'non-existent' })
        ).rejects.toThrow(ApiKeyNotFoundError)
    })

    it('should revoke an already revoked key (idempotent)', async () => {
        const apiKey = makeApiKey({ id: 'key-1', status: 'revoked' })
        await repository.save(apiKey)
        apiKey.revoke() // Ensure it's revoked

        const result = await useCase.execute({ apiKeyId: 'key-1' })

        expect(result.status).toBe('revoked')

        const revoked = await repository.findById('key-1')
        expect(revoked?.getStatus()).toBe('revoked')
    })

    it('should handle multiple revocations', async () => {
        const apiKey1 = makeApiKey({ id: 'key-1' })
        const apiKey2 = makeApiKey({ id: 'key-2' })
        await repository.save(apiKey1)
        await repository.save(apiKey2)

        await useCase.execute({ apiKeyId: 'key-1' })
        await useCase.execute({ apiKeyId: 'key-2' })

        const revoked1 = await repository.findById('key-1')
        const revoked2 = await repository.findById('key-2')

        expect(revoked1?.getStatus()).toBe('revoked')
        expect(revoked2?.getStatus()).toBe('revoked')
    })
})

