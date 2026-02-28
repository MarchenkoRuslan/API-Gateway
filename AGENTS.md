# Agent Working Notes for API-Gateway (CoART / Symbol Blockchain)

## Goal

Move fast with minimal codebase scanning. Start from known entrypoints, then expand only when needed.

## Code-First Discipline

- **Read before write.** Before changing code, read the relevant files fully. Understand existing patterns, naming, error handling, and structure.
- **Build on what exists.** Reuse existing services, helpers, and conventions. Do not introduce new patterns where project patterns already exist.
- **Preserve consistency.** Match indentation, JSDoc style, import order, and error handling of surrounding code.
- **Minimal diff.** Change only what is necessary. Avoid refactoring unrelated code unless explicitly requested.

## Project Snapshot

- Stack: Express.js + Symbol SDK (v2.x), TypeScript.
- Entrypoint: `src/server.ts` → listens on PORT (default 4000).
- App setup: `src/app.ts` (CORS, body-parser, routes at `/api`).
- Routes: `src/routes/index.ts` — CoART-specific endpoints under `/api`.
- Config: `src/helpers/constants.ts` (NETWORK_IDENTIFIER, mosaic params), `utils/env-config.ts` (dotenv).
- Crypto: `utils/cryptoUtils.ts` — AES-256-GCM for `/transaction/sendEncrypted` (ENCRYPTION_KEY 32 chars).

## Read-First Map (By Task Type)

- Startup / config / env:
  - `src/server.ts`
  - `src/app.ts`
  - `src/helpers/constants.ts`
  - `utils/env-config.ts`
  - `.env` / `docker-compose-testnet.yml` (env reference)
- Account (wallet creation, balance, transactions):
  - `src/routes/endpoints/coartSpec/account.ts`
  - `src/services/symbol-sdk/accountService.ts`
- Transaction (send, status, cosign):
  - `src/routes/endpoints/coartSpec/transaction.ts`
  - `src/services/symbol-sdk/transactionService.ts`
- Selling (mosaic sale flows):
  - `src/routes/endpoints/coartSpec/Selling.ts`
  - `src/services/symbol-sdk/transactionService.ts`
  - `src/services/symbol-sdk/multisig/transactionMultisigService.ts`
- HD-wallets:
  - `src/routes/endpoints/hd-wallets/walletCreator.ts`, `keyGenerator.ts`, `hdAccounts.ts`
  - `src/services/hd-wallets/walletCreatorService.ts`, `keyGeneratorService.ts`, `hdAccountsService.ts`
- Multisig:
  - `src/routes/endpoints/coartSpec/multisig.ts`
  - `src/services/symbol-sdk/multisig/*`
- Blockchain (height, metadata):
  - `src/routes/endpoints/coartSpec/blockchain.ts`
  - `src/services/symbol-sdk/blockchainService.ts`
- NFT (mosaic metadata):
  - `src/routes/endpoints/coartSpec/NFT.ts`
- Crypto / encryption:
  - `utils/cryptoUtils.ts` (ENCRYPTION_KEY required for sendEncrypted)

## Search Policy (Do This Before Global Scans)

- Do not scan the whole repository first.
- Start with the read-first map above for the relevant domain.
- Use targeted symbol search only if needed.
- Expand to other files only when a referenced symbol is unresolved.

## Environment / .env

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | Yes | Server port (default 4000) |
| URL | Yes | Symbol REST node URL (e.g. https://sym-test-01.opening-line.jp:3001) |
| NETWORK_IDENTIFIER | No | TEST_NET or MAIN_NET (default TEST_NET) |
| EPOCH_ADJUSTMENT | No | Network epoch (from docker-compose) |
| MAX_FEE | No | Max fee amount |
| NETWORK_CURRENCY_MOSAIC_ID_STRING | No | symbol.xym mosaic ID |
| NETWORK_NEMESIS_PRIVATE_KEY | No | For some operations |
| ENCRYPTION_KEY | If sendEncrypted | 32 characters for AES-256-GCM |

## Deployment

- Docker: `docker-compose -f docker-compose-testnet.yml up -d` (testnet) or `docker-compose.yml` / `docker-compose-mainnet.yml`.
- Production: `npm run prod` (build + node dist/src/server.js). PORT from env.
- Railway: Use Dockerfile or Nixpacks. Set variables from `.env.example`. Healthcheck: `GET /health`.

## Known Context to Avoid Re-Learning

- API base: `http://localhost:4000/api/` (or PORT from env).
- Swagger: `/api-docs` (only coartSpec and hd-wallets routes in spec).
- Symbol addresses: T... (testnet) or N... (mainnet); not 0x-style.
- `account/create` expects `userId` in body; returns `address`, `privateKey`, `publicKey`.
- `transaction/send` expects: `senderPrivateKey`, `recipientAddress`, `namespaceName`, `amount`, `message`.
- `transaction/sendMosaic` uses `mosaicId` instead of `namespaceName`.
