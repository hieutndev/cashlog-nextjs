# Copilot Instructions for CashLog

## Architecture Overview

**CashLog** is a Next.js 15 financial tracking application using the App Router with a layered API architecture. The codebase follows a strict separation of concerns pattern (documented in `ARCHITECTURE.md` and `REFACTORING_PATTERN.md`).

### Core Technology Stack
- **Framework**: Next.js 15 with App Router, React 18, TypeScript
- **Database**: MySQL 2 with connection pooling (`mysqlPool` in `libs/mysql.ts`)
- **UI**: HeroUI v2 components, Tailwind CSS, Framer Motion
- **Validation**: Zod schemas with custom validation utilities
- **Auth**: JWT tokens (jose library) with middleware-injected user context

### Key Architectural Layers

```
Route Handlers (app/api/**/route.ts)
    ↓ Parse request, validate, format response
Service Layer (*-services.ts)
    ↓ Business logic, orchestration
Database Helper (libs/mysql.ts: dbQuery)
    ↓ Connection pooling, query execution
SQL Constants (configs/query-string.ts)
    ↓ All SQL queries centralized
Types (types/*)
    ↓ TypeScript interfaces shared across layers
```

**Critical Rule**: Route handlers MUST NOT contain SQL queries or business logic. All SQL goes in `QUERY_STRING`, all business logic goes in service functions.

## Database Access Patterns

### Standard Query Pattern
```typescript
import { dbQuery } from '@/libs/mysql';
import { QUERY_STRING } from '@/configs/query-string';

const results = await dbQuery<RowDataPacket[]>(
  QUERY_STRING.GET_ALL_ITEMS,
  [userId, filter]
);
```

### Transaction Pattern (Exception to dbQuery rule)
```typescript
const connection = await mysqlPool.getConnection();
try {
  await connection.beginTransaction();
  await connection.query(QUERY_STRING.UPDATE_ITEM, [params]);
  await connection.query(QUERY_STRING.CREATE_LOG, [params]);
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

**Never** create new connection pools. Always use `mysqlPool` or `dbQuery` from `libs/mysql.ts`.

## API Route Structure

All API routes follow this exact pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getFromHeaders } from '../_helpers/get-from-headers';
import { handleError, handleValidateError } from '../_helpers/handle-error';
import { zodValidate } from '@/utils/zod-validate';
import { serviceFunction, validationSchema } from './service-file';

export async function GET(request: NextRequest) {
  try {
    const userId = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0);
    
    // Extract params
    const searchParams = request.nextUrl.searchParams;
    
    // Validate
    const { is_valid, errors } = zodValidate(validationSchema, data);
    if (!is_valid) return handleValidateError(errors);
    
    // Call service
    const results = await serviceFunction(userId, params);
    
    return NextResponse.json({
      status: "success",
      message: "Operation completed",
      results
    });
  } catch (error) {
    return handleError(error);
  }
}

Note: route handlers should not throw ApiError directly. Always return the standardized error response using the helper, for example:

```ts
// wrong (don't do this in route handlers)
throw new ApiError('error message', 400);

// correct (route handlers should return the handled error)
return handleError(new ApiError('error message', 400));
```
```

### Response Format Standards
- **Success**: `{ status: "success", message: string, results: T }`
- **Error**: `{ status: "error", message: string, validateErrors?: ZodCustomError[] }`
- **Status codes**: 200 (OK), 201 (Created), 400 (Validation), 401 (Auth), 404 (Not Found), 500 (Error)

## Authentication & Middleware

The middleware (`middleware.ts`) intercepts protected routes, validates JWT tokens, and injects `x-user-id` header. Routes access it via:

```typescript
const userId = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0);
```

Protected routes are defined in `middleware.ts` config matcher (cards, transactions, categories, analytics, recurrings).

## Validation Pattern

Use Zod schemas defined in service files:

```typescript
// In *-services.ts
export const createItemPayload = z.object({
  name: z.string().min(1, { message: VALIDATE_MESSAGE.REQUIRED_VALUE }),
  amount: z.number().positive({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO }),
  direction: z.enum(['in', 'out'], { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE })
});

// In route.ts
const { is_valid, errors } = zodValidate(createItemPayload, body);
if (!is_valid) return handleValidateError(errors);
```

Import validation messages from `utils/api/zod-validate-message.ts` for consistency.

## Type System

- All types in `types/` directory with clear naming: `TUser`, `TCard`, `TTransaction`, `TRecurring`
- Use const arrays for enums: `export const RECURRING_STATUS: TRecurringStatus[] = ['active', 'paused', ...]`
- Compound types: `TTransactionWithCardAndCategory = TTransaction & TCard & TCategory`

## Service Function Patterns

Service functions handle all business logic:

```typescript
export async function getAllItems(
  userId: string,
  filters: TItemFilters = {}
): Promise<TItem[]> {
  let query = QUERY_STRING.GET_ALL_ITEMS;
  const params: any[] = [userId];
  
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  
  return await dbQuery<TItem[]>(query, params);
}
```

Common patterns: `getAllXByUser`, `getXById`, `createX`, `updateX`, `deleteX`. See `REFACTORING_PATTERN.md` for detailed examples.

## Module Structure

Each API module (`app/api/[module]/`) contains:
- `route.ts` - Main CRUD endpoints
- `[id]/route.ts` - Single resource operations
- `*-services.ts` - Business logic functions
- `_helpers/` - Shared utilities (don't expose in API)

Example: `app/api/recurrings/` has the most complete implementation following this architecture.

## API Endpoint Constants

All API endpoints must be defined in `configs\api-endpoint.ts` and follow the structure:
`API_ENDPOINT -> RESOURCE NAME -> ACTION`.

Example:

```ts
// API endpoint: /cards
export const API_ENDPOINT = {
  CARDS: {
    ADD_NEW_CARD: "/cards",
    GET_ALL_CARDS: "/cards",
    GET_CARD_INFO: (cardId: TCard['card_id']) => `/cards/${cardId}`,
  },
};
```

Note: For cases like `GET_CARD_INFO` where a dynamic parameter is passed, the parameter’s type must use the same type as the corresponding ID field (for example `TCard['card_id']`).

## Development Workflow

### Running the App
```powershell
yarn dev          # Development with Turbopack
yarn build        # Production build (uses 4GB memory allocation)
yarn start        # Production server
yarn lint         # ESLint with auto-fix
```

### Common Tasks
- **Add SQL query**: Update `QUERY_STRING` in `configs/query-string.ts`
- **New API endpoint**: Create route handler → service function → add types → add SQL
- **Validation**: Define Zod schema in service file, use `zodValidate` in route

## Recurring Transactions Feature

The `recurrings` module is the reference implementation. Key concepts:
- **Recurrings**: Template for repeating transactions
- **Instances**: Individual scheduled occurrences
- Complex frequency logic (daily, weekly, monthly, yearly with configs)
- Instance lifecycle: pending → completed/skipped/overdue
- Tied to actual transactions when completed

## Important Files Reference

- `middleware.ts` - Auth & user context injection
- `libs/mysql.ts` - Database connection pool & helpers
- `configs/query-string.ts` - ALL SQL queries (900+ lines)
- `types/recurring.ts` - Most complex type definitions
- `app/api/_helpers/` - Error handling, header parsing, validation
- `ARCHITECTURE.md` - Architecture diagrams
- `REFACTORING_PATTERN.md` - Step-by-step refactoring guide with code examples

## Code Quality Rules

✅ **DO:**
- Use `dbQuery` helper for all single queries
- Put all SQL in `QUERY_STRING`
- Define Zod schemas in service files
- Use TypeScript types from `types/` directory
- Follow the thin route handler pattern
- Use `getFromHeaders` for user context
- Use `handleError` and `handleValidateError` for consistent error responses
- Keep connections only for transactions (with proper try/finally release)

❌ **DON'T:**
- Write SQL directly in route handlers
- Create new connection pools
- Put business logic in route handlers
- Duplicate SQL queries across files
- Use inline validation without Zod
- Forget to release database connections in transactions
- Mix service logic with HTTP concerns
 - Throw ApiError from route handlers; instead return errors with the central helper: `return handleError(new ApiError(...))`

## Special Considerations

- **Runtime**: Most API routes use `export const runtime = 'nodejs'`
- **Package Manager**: Project uses Yarn (see `packageManager` in package.json)
- **Path Aliases**: `@/` maps to project root
- **Card Balance**: Updated automatically via `updateCardBalance` when transactions change
- **Ownership Validation**: Always verify user owns resource before operations (see `validateCardOwnership`, `validateCategoryOwnership`)
