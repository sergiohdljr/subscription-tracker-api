import { CreateApiKeyUseCase } from '@/modules/identity/application/use-cases/create-api-key-usecase'
import { InMemoryApiKeyRepository } from '@/modules/identity/infrastructure/repositories/in-memory-api-key-repository'
import { ApiKey } from '@/modules/identity/domain/entities/api-key'
import { Scope } from '@/modules/identity/domain/entities/scope'

describe('CreateApiKeyUseCase', () => {
    let useCase: CreateApiKeyUseCase
    let repository: InMemoryApiKeyRepository

    beforeEach(() => {
        repository = new InMemoryApiKeyRepository()
        useCase = new CreateApiKeyUseCase(repository)
    })

    it('should create an API key with minimal input', async () => {
        const input = {
            ownerId: 'user-1'
        }

        const result = await useCase.execute(input)

        expect(result.id).toBeDefined()
        expect(result.apiKey).toMatch(/^sk_live_[a-f0-9]+$/)
        expect(result.ownerId).toBe('user-1')
        expect(result.hash).toBeDefined()
        expect(result.scopes).toEqual([])
        expect(result.expiresAt).toBeNull()
    })

    it('should create an API key with name', async () => {
        const input = {
            ownerId: 'user-1',
            name: 'My API Key'
        }

        const result = await useCase.execute(input)

        expect(result.name).toBe('My API Key')
        expect(result.ownerId).toBe('user-1')
    })

    it('should create an API key with expiration date', async () => {
        const expiresAt = new Date('2025-12-31T23:59:59.000Z')
        const input = {
            ownerId: 'user-1',
            expiresAt
        }

        const result = await useCase.execute(input)

        expect(result.expiresAt).toEqual(expiresAt)
    })

    it('should create an API key with scopes', async () => {
        const input = {
            ownerId: 'user-1',
            scopes: ['subscriptions:read', 'subscriptions:write']
        }

        const result = await useCase.execute(input)

        expect(result.scopes).toHaveLength(2)
        expect(result.scopes).toContain('subscriptions:read')
        expect(result.scopes).toContain('subscriptions:write')
    })

    it('should create an API key with all optional fields', async () => {
        const expiresAt = new Date('2025-12-31T23:59:59.000Z')
        const input = {
            ownerId: 'user-1',
            name: 'Full Featured Key',
            expiresAt,
            scopes: ['subscriptions:read', 'users:read']
        }

        const result = await useCase.execute(input)

        expect(result.name).toBe('Full Featured Key')
        expect(result.ownerId).toBe('user-1')
        expect(result.expiresAt).toEqual(expiresAt)
        expect(result.scopes).toHaveLength(2)
        expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should generate unique API keys for each call', async () => {
        const input = {
            ownerId: 'user-1'
        }

        const result1 = await useCase.execute(input)
        const result2 = await useCase.execute(input)

        expect(result1.apiKey).not.toBe(result2.apiKey)
        expect(result1.id).not.toBe(result2.id)
        expect(result1.hash).not.toBe(result2.hash)
    })
})

