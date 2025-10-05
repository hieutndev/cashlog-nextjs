# Refactoring Pattern Guide

This guide shows the pattern used to refactor the recurring module. Use this as a template when refactoring other modules.

## Step-by-Step Refactoring Process

### Step 1: Move Types to `/types` Directory

**Before:**
```typescript
// In service file
export interface RecurringData {
  recurring_name: string;
  amount: number;
  // ...
}
```

**After:**
```typescript
// In /types/recurring.ts
export interface RecurringData {
  recurring_name: string;
  amount: number;
  // ...
}

// In service file
import { RecurringData } from '@/types/recurring';
```

### Step 2: Move SQL Queries to `/configs/query-string.ts`

**Before:**
```typescript
// In route or service
const query = `SELECT * FROM recurrings WHERE user_id = ?`;
const [rows] = await connection.query(query, [userId]);
```

**After:**
```typescript
// In /configs/query-string.ts
export const QUERY_STRING = {
  GET_ALL_RECURRINGS_BY_USER: `
    SELECT * FROM recurrings WHERE user_id = ?
  `,
  // ... other queries
};

// In service file
import { QUERY_STRING } from '@/configs/query-string';
const rows = await dbQuery(QUERY_STRING.GET_ALL_RECURRINGS_BY_USER, [userId]);
```

### Step 3: Replace Connection Pool with dbQuery

**Before:**
```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  // ...
});

const connection = await pool.getConnection();
try {
  const [rows] = await connection.query('SELECT ...', [params]);
  // process rows
} finally {
  connection.release();
}
```

**After:**
```typescript
import { dbQuery } from '@/libs/mysql';
import { QUERY_STRING } from '@/configs/query-string';

const rows = await dbQuery<RowDataPacket[]>(
  QUERY_STRING.GET_SOMETHING,
  [params]
);
// process rows
```

**Exception - When Transaction is Required:**
```typescript
// Keep connection for transaction management
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  // Multiple operations
  await connection.query(QUERY_STRING.OPERATION_1, [params1]);
  await connection.query(QUERY_STRING.OPERATION_2, [params2]);
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

### Step 4: Create Service Functions

**Before (in route file):**
```typescript
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  // Build query
  let query = `SELECT * FROM recurrings WHERE user_id = ?`;
  const params = [userId];
  
  if (searchParams.get('status')) {
    query += ' AND status = ?';
    params.push(searchParams.get('status'));
  }
  
  const connection = await pool.getConnection();
  const [rows] = await connection.query(query, params);
  connection.release();
  
  return NextResponse.json({ results: rows });
}
```

**After:**
```typescript
// In service file
export async function getAllRecurrings(
  userId: string,
  filters: RecurringFilters = {}
): Promise<RecurringTransaction[]> {
  let query = QUERY_STRING.GET_ALL_RECURRINGS_BY_USER;
  const params: any[] = [userId];
  
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  
  const rows = await dbQuery<RowDataPacket[]>(query, params);
  return rows as RecurringTransaction[];
}

// In route file
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  const filters: RecurringFilters = {
    status: searchParams.get('status') as RecurringStatus,
  };
  
  const results = await getAllRecurrings(userId!, filters);
  
  return NextResponse.json({ results });
}
```

### Step 5: Simplify Route Handlers

**Before:**
```typescript
export async function POST(request: NextRequest) {
  // 100+ lines of:
  // - Parsing
  // - Validation
  // - Database queries
  // - Business logic
  // - Error handling
  // - Response formatting
}
```

**After:**
```typescript
export async function POST(request: NextRequest) {
  // ~30 lines of:
  // - Parsing
  // - Basic validation
  // - Call service function
  // - Response formatting
  
  const userId = request.headers.get('x-user-id');
  const body = await request.json();
  
  // Validate
  if (!body.name || !body.amount) {
    return NextResponse.json({ error: '...' }, { status: 400 });
  }
  
  // Call service
  const result = await createRecurring(userId!, body);
  
  // Response
  return NextResponse.json({ results: result });
}
```

## Common Patterns

### Pattern 1: List with Filters

```typescript
// Service
export async function getAllItems(
  userId: string,
  filters: ItemFilters = {}
): Promise<Item[]> {
  let query = QUERY_STRING.GET_ALL_ITEMS;
  const params: any[] = [userId];
  
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  
  if (filters.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }
  
  query += ' ORDER BY created_at DESC';
  
  return await dbQuery<Item[]>(query, params);
}

// Route
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!;
  const searchParams = request.nextUrl.searchParams;
  
  const filters: ItemFilters = {
    status: searchParams.get('status') ?? undefined,
    category: searchParams.get('category') ?? undefined,
  };
  
  const results = await getAllItems(userId, filters);
  return NextResponse.json({ results });
}
```

### Pattern 2: Get Single Item by ID

```typescript
// Service
export async function getItemById(
  itemId: string,
  userId: string
): Promise<Item> {
  const rows = await dbQuery<RowDataPacket[]>(
    QUERY_STRING.GET_ITEM_BY_ID,
    [itemId, userId]
  );
  
  if (rows.length === 0) {
    throw new Error('Item not found');
  }
  
  return rows[0] as Item;
}

// Route
export async function GET(
  request: NextRequest,
  { params }: { params: { recurring_instance_id: string } }
) {
  const userId = request.headers.get('x-user-id')!;
  
  try {
    const result = await getItemById(params.id, userId);
    return NextResponse.json({ results: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    );
  }
}
```

### Pattern 3: Create Item

```typescript
// Service
export async function createItem(
  userId: string,
  data: CreateItemData
): Promise<{ itemId: string; success: boolean }> {
  // Validate
  const validationResult = await validateItemData(userId, data);
  if (!validationResult.valid) {
    throw new Error(validationResult.error);
  }
  
  // Insert
  const result = await dbQuery<ResultSetHeader>(
    QUERY_STRING.INSERT_ITEM,
    [userId, data.name, data.amount, ...]
  );
  
  return {
    itemId: result.insertId.toString(),
    success: true
  };
}

// Route
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!;
  const body = await request.json();
  
  // Basic validation
  if (!body.name || !body.amount) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }
  
  try {
    const result = await createItem(userId, body);
    return NextResponse.json({ results: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Pattern 4: Update Item

```typescript
// Service
export async function updateItem(
  itemId: string,
  userId: string,
  updates: Partial<ItemData>
): Promise<{ success: boolean }> {
  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.name) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  
  if (updates.amount) {
    fields.push('amount = ?');
    values.push(updates.amount);
  }
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  const query = `UPDATE items SET ${fields.join(', ')}, updated_at = NOW() WHERE item_id = ? AND user_id = ?`;
  values.push(itemId, userId);
  
  await dbQuery(query, values);
  
  return { success: true };
}

// Route
export async function PUT(
  request: NextRequest,
  { params }: { params: { recurring_instance_id: string } }
) {
  const userId = request.headers.get('x-user-id')!;
  const body = await request.json();
  
  // Validation
  if (body.amount !== undefined && body.amount <= 0) {
    return NextResponse.json(
      { error: 'Invalid amount' },
      { status: 400 }
    );
  }
  
  try {
    const result = await updateItem(params.id, userId, body);
    return NextResponse.json({ results: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Pattern 5: Delete Item

```typescript
// Service
export async function deleteItem(
  itemId: string,
  userId: string,
  options: DeleteOptions = {}
): Promise<{ success: boolean }> {
  // Check ownership
  const item = await getItemById(itemId, userId);
  
  // Perform deletion based on options
  if (options.soft) {
    await dbQuery(
      QUERY_STRING.SOFT_DELETE_ITEM,
      [itemId, userId]
    );
  } else {
    await dbQuery(
      QUERY_STRING.DELETE_ITEM,
      [itemId, userId]
    );
  }
  
  return { success: true };
}

// Route
export async function DELETE(
  request: NextRequest,
  { params }: { params: { recurring_instance_id: string } }
) {
  const userId = request.headers.get('x-user-id')!;
  const searchParams = request.nextUrl.searchParams;
  
  const options: DeleteOptions = {
    soft: searchParams.get('soft') === 'true',
  };
  
  try {
    const result = await deleteItem(params.id, userId, options);
    return NextResponse.json({ results: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## Checklist for Refactoring

- [ ] Move all types/interfaces to `/types` directory
- [ ] Move all SQL queries to `/configs/query-string.ts`
- [ ] Replace connection pool usage with `dbQuery` helper
- [ ] Create service functions for all business logic
- [ ] Simplify route handlers to only handle HTTP concerns
- [ ] Remove duplicate code
- [ ] Add proper error handling
- [ ] Update imports across all files
- [ ] Test all endpoints
- [ ] Verify no compilation errors
- [ ] Verify no linting errors

## Anti-Patterns to Avoid

❌ **Don't put SQL in route files**
```typescript
// BAD
export async function GET(request: NextRequest) {
  const [rows] = await connection.query('SELECT * FROM ...');
}
```

❌ **Don't put business logic in route files**
```typescript
// BAD
export async function POST(request: NextRequest) {
  // 100 lines of data processing and business rules
}
```

❌ **Don't create connection pools in multiple places**
```typescript
// BAD - each file creates its own pool
const pool = mysql.createPool({ ... });
```

❌ **Don't duplicate query strings**
```typescript
// BAD
// In file 1:
const query1 = 'SELECT * FROM users WHERE id = ?';
// In file 2:
const query2 = 'SELECT * FROM users WHERE id = ?';
```

## Best Practices

✅ **Use dbQuery for simple queries**
✅ **Keep connection only for transactions**
✅ **Define all types in `/types` directory**
✅ **Store all queries in `/configs/query-string.ts`**
✅ **One service function per operation**
✅ **Route handlers should be thin**
✅ **Service functions should be testable**
✅ **Use TypeScript types everywhere**

---

## Quick Reference

### Import Structure
```typescript
// Route file
import { NextRequest, NextResponse } from 'next/server';
import { serviceFunction } from './service-file';
import { TypeName } from '@/types/type-file';

// Service file
import { dbQuery } from '@/libs/mysql';
import { QUERY_STRING } from '@/configs/query-string';
import { TypeName } from '@/types/type-file';
```

### Error Handling
```typescript
// In service
throw new Error('Descriptive error message');

// In route
try {
  const result = await serviceFunction();
  return NextResponse.json({ results: result });
} catch (error: any) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: error.message || 'Operation failed' },
    { status: 500 }
  );
}
```

### Response Format
```typescript
// Success
return NextResponse.json({
  status: "success",
  message: "Operation completed successfully",
  results: data,
});

// Error
return NextResponse.json(
  { error: 'Error message' },
  { status: 400 | 401 | 404 | 500 }
);
```
