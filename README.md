# Subscription Tracker API

API RESTful para gerenciamento de assinaturas (subscriptions) desenvolvida com TypeScript, Fastify e PostgreSQL. O projeto implementa uma arquitetura limpa (Clean Architecture) seguindo os princípios de Domain-Driven Design (DDD).

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Banco de Dados](#banco-de-dados)
- [Autenticação](#autenticação)
- [API Endpoints](#api-endpoints)
- [Documentação da API](#documentação-da-api)

## 🎯 Sobre o Projeto

O Subscription Tracker API é uma aplicação backend que permite aos usuários gerenciar suas assinaturas de serviços, incluindo:

- Criação e listagem de assinaturas
- Gerenciamento de ciclos de cobrança (semanal, mensal, anual)
- Suporte a períodos de trial
- Notificações de renovação
- Autenticação e autorização de usuários

## 🛠 Tecnologias

### Core
- **TypeScript** - Linguagem de programação
- **Node.js** - Runtime JavaScript
- **Fastify** - Framework web rápido e eficiente

### Banco de Dados
- **PostgreSQL** - Banco de dados relacional
- **Drizzle ORM** - ORM type-safe para TypeScript
- **Drizzle Kit** - Ferramentas de migração e gerenciamento de schema

### Autenticação
- **Better Auth** - Sistema de autenticação moderno e seguro

### Infraestrutura
- **Docker & Docker Compose** - Containerização e orquestração
- **Resend** - Serviço de envio de emails

### Ferramentas de Desenvolvimento
- **Biome** - Linter e formatador de código
- **Swagger/Scalar** - Documentação interativa da API
- **tsx** - Executor TypeScript para desenvolvimento

## 🏗 Arquitetura

O projeto segue os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, organizando o código em camadas bem definidas:

### Camadas da Arquitetura

```
┌─────────────────────────────────────────┐
│         Infrastructure Layer            │
│  (HTTP, Database, External Services)    │
├─────────────────────────────────────────┤
│         Application Layer               │
│  (Use Cases, Services, DTOs)           │
├─────────────────────────────────────────┤
│         Domain Layer                    │
│  (Entities, Value Objects, Errors)     │
└─────────────────────────────────────────┘
```

#### 1. **Domain Layer** (Camada de Domínio)
- **Entities**: Entidades de negócio (`Subscription`, `User`)
- **Value Objects**: Objetos de valor (`Money`, `BillingCycle`)
- **Errors**: Erros específicos do domínio
- **Repositories Interfaces**: Contratos para repositórios

#### 2. **Application Layer** (Camada de Aplicação)
- **Use Cases**: Casos de uso da aplicação
- **Services**: Serviços de aplicação (ex: notificações)
- **DTOs**: Data Transfer Objects
- **Repositories**: Interfaces de repositórios

#### 3. **Infrastructure Layer** (Camada de Infraestrutura)
- **HTTP**: Controllers, rotas, middlewares, plugins
- **Database**: Implementações de repositórios com Drizzle ORM
- **External Services**: Integrações com serviços externos (Resend, etc.)
- **Shared**: Recursos compartilhados (configurações, conexões)

### Princípios Aplicados

- **Dependency Inversion**: As camadas superiores não dependem das inferiores
- **Separation of Concerns**: Cada camada tem responsabilidades bem definidas
- **Single Responsibility**: Cada classe/módulo tem uma única responsabilidade
- **Domain-Driven Design**: O domínio é o coração da aplicação

## 📁 Estrutura do Projeto

```
subscription-tracker-api/
├── src/
│   ├── index.ts                          # Ponto de entrada da aplicação
│   ├── modules/                          # Módulos da aplicação
│   │   ├── auth/                         # Módulo de autenticação
│   │   │   └── infrastructure/
│   │   │       ├── better-auth/          # Configuração Better Auth
│   │   │       └── http/                 # Rotas e plugins HTTP
│   │   ├── subscriptions/                # Módulo de assinaturas
│   │   │   ├── application/              # Camada de aplicação
│   │   │   │   ├── use-cases/           # Casos de uso
│   │   │   │   ├── services/            # Serviços de aplicação
│   │   │   │   └── repositories/        # Interfaces de repositórios
│   │   │   ├── domain/                   # Camada de domínio
│   │   │   │   ├── entity/              # Entidades
│   │   │   │   ├── value-objects/       # Objetos de valor
│   │   │   │   └── errors/              # Erros do domínio
│   │   │   └── infrastucture/           # Camada de infraestrutura
│   │   │       ├── http/                # Controllers e rotas
│   │   │       └── repositories/        # Implementações de repositórios
│   │   └── user/                         # Módulo de usuários
│   │       ├── application/
│   │       ├── domain/
│   │       └── infrastructure/
│   └── shared/                           # Recursos compartilhados
│       └── infrastructure/
│           ├── db/                       # Configuração do banco de dados
│           │   └── drizzle/
│           │       ├── schemas/          # Schemas do Drizzle
│           │       ├── migrations/       # Migrações do banco
│           │       └── mappers/          # Mappers de dados
│           ├── docs/                     # Documentação Swagger
│           ├── email/                     # Configuração de email
│           ├── http/                     # Configurações HTTP compartilhadas
│           └── notifications/           # Adaptadores de notificação
├── docker-compose.yml                    # Configuração Docker Compose
├── drizzle.config.ts                     # Configuração Drizzle Kit
├── package.json                          # Dependências e scripts
└── tsconfig.json                         # Configuração TypeScript
```

## 📦 Pré-requisitos

- **Node.js** >= 18.x
- **npm** ou **yarn**
- **Docker** e **Docker Compose** (para o banco de dados)
- **PostgreSQL** 16+ (se não usar Docker)

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/sergiohdljr/subscription-tracker-api.git
cd subscription-tracker-api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente (veja [Configuração](#configuração))

4. Inicie o banco de dados com Docker Compose:
```bash
docker-compose up -d
```

5. Execute as migrações do banco de dados:
```bash
npm run db:migrate
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/subscription_tracker

# Application
BASE_URL=http://localhost:8080
PORT=8080

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:8080

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Logging
LOG_LEVEL=debug
NODE_ENV=development
```

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DATABASE_URL` | URL de conexão com PostgreSQL | - |
| `BASE_URL` | URL base da aplicação | `http://localhost:8080` |
| `PORT` | Porta do servidor | `8080` |
| `BETTER_AUTH_SECRET` | Chave secreta para Better Auth | - |
| `BETTER_AUTH_URL` | URL do Better Auth | - |
| `RESEND_API_KEY` | Chave da API Resend | - |
| `LOG_LEVEL` | Nível de log (trace, debug, info, warn, error, fatal) | `debug` (dev) / `info` (prod) |
| `NODE_ENV` | Ambiente de execução (development, production) | `development` |

## ▶️ Executando o Projeto

### Modo Desenvolvimento

```bash
npm run dev
```

O servidor será iniciado em `http://localhost:8080` com hot-reload habilitado.

### Modo Produção

```bash
npm run build
npm start
```

## 📜 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor em modo desenvolvimento com hot-reload |
| `npm start` | Inicia o servidor em modo produção |
| `npm run db:generate` | Gera migrações baseadas nos schemas |
| `npm run db:migrate` | Executa as migrações do banco de dados |
| `npm run db:push` | Sincroniza o schema com o banco (sem migrações) |
| `npm run db:studio` | Abre o Drizzle Studio (UI para o banco) |
| `npm run lint` | Executa o linter |
| `npm run lint:fix` | Corrige problemas do linter automaticamente |
| `npm run format` | Formata o código |
| `npm run format:check` | Verifica a formatação do código |
| `npm run check` | Executa lint e format check |
| `npm run check:fix` | Corrige lint e formata o código |

## 🗄 Banco de Dados

### Schema Principal

O banco de dados utiliza PostgreSQL com os seguintes schemas principais:

#### Tabela `subscriptions`
- `id`: ID único da assinatura (serial)
- `user_id`: ID do usuário (foreign key)
- `name`: Nome da assinatura
- `price`: Preço (decimal)
- `currency`: Moeda (BRL, USD)
- `billing_cycle`: Ciclo de cobrança (WEEKLY, MONTHLY, YEARLY)
- `status`: Status (ACTIVE, INACTIVE, TRIAL)
- `start_date`: Data de início
- `next_billing_date`: Próxima data de cobrança
- `last_billing_date`: Última data de cobrança
- `renewal_notified_at`: Data da última notificação de renovação
- `trial_ends_at`: Data de término do trial
- `created_at`: Data de criação
- `updated_at`: Data de atualização

#### Tabela `user` (Better Auth)
Gerenciada pelo Better Auth, contém informações de autenticação e perfil do usuário.

### Migrações

As migrações são gerenciadas pelo Drizzle Kit. Para criar uma nova migração:

```bash
npm run db:generate
```

Para executar as migrações:

```bash
npm run db:migrate
```

## 🔐 Autenticação

A autenticação é gerenciada pelo **Better Auth**, que fornece:

- Registro de usuários com email e senha
- Login e logout
- Gerenciamento de sessões
- Middleware de autenticação

### Endpoints de Autenticação

- `POST /api/auth/sign-up/email` - Registrar novo usuário
- `POST /api/auth/sign-in/email` - Fazer login
- `GET /api/auth/get-session` - Obter sessão atual
- `POST /api/auth/sign-out` - Fazer logout

### Middleware de Autenticação

O middleware `betterAuthMiddleware` é aplicado globalmente e verifica a autenticação em todas as rotas protegidas.

## 🌐 API Endpoints

### Assinaturas

#### Criar Assinatura
```http
POST /api/subscriptions
Content-Type: application/json
Cookie: better-auth.session_token=<token>

{
  "name": "Netflix",
  "price": "29.90",
  "currency": "BRL",
  "billingCycle": "MONTHLY",
  "startDate": "2024-01-01T00:00:00Z",
  "trialEndsAt": "2024-01-15T00:00:00Z" // Opcional
}
```

#### Listar Assinaturas
```http
GET /api/subscriptions
Cookie: better-auth.session_token=<token>
```

### Autenticação

Todos os endpoints de autenticação estão disponíveis em `/api/auth/*` conforme documentação do Better Auth.

## 📚 Documentação da API

A documentação interativa da API está disponível em:

- **Swagger UI**: `http://localhost:8080/docs`
- **Scalar API Reference**: `http://localhost:8080/docs`

A documentação inclui:
- Descrição de todos os endpoints
- Schemas de requisição e resposta
- Exemplos de uso
- Autenticação via cookies

## 🏛 Módulos da Aplicação

### Módulo de Assinaturas

Gerencia o ciclo de vida das assinaturas:

- **Criação**: Validação de dados, inicialização de datas de cobrança
- **Listagem**: Busca de assinaturas por usuário
- **Renovação**: Processamento automático de renovações
- **Notificações**: Envio de notificações antes da renovação

### Módulo de Usuários

Gerencia informações dos usuários e integração com Better Auth.

### Módulo de Autenticação

Configuração e integração do Better Auth com a aplicação.

## 🔄 Fluxo de Dados

```
HTTP Request
    ↓
Controller (Infrastructure)
    ↓
Use Case (Application)
    ↓
Repository Interface (Application)
    ↓
Repository Implementation (Infrastructure)
    ↓
Database (PostgreSQL)
```

## 🧪 Desenvolvimento

### Convenções de Código

- **TypeScript strict mode** habilitado
- **Biome** para linting e formatação
- **Path aliases** configurados (`@/*` aponta para `src/*`)
- **Naming**: camelCase para variáveis/funções, PascalCase para classes

### Estrutura de Commits

Siga as convenções de commits semânticos:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de manutenção

## 📝 Licença

ISC

## 👤 Autor

Sergio H. D. L. Junior

## 🔗 Links

- [Repositório GitHub](https://github.com/sergiohdljr/subscription-tracker-api)
- [Issues](https://github.com/sergiohdljr/subscription-tracker-api/issues)

