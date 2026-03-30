---
name: drizzle-best-practices
description: >-
  Drizzle ORM patterns -- schema definition, type-safe queries, relations,
  migrations, transactions, upserts, prepared statements, and connection setup.
  Use when building or reviewing apps with Drizzle ORM, when setting up a new
  database with Drizzle, when writing queries or migrations, or when configuring
  Drizzle for production.
keywords: drizzle, drizzle orm, drizzle schema, drizzle query, drizzle
  relations, drizzle migration, drizzle typescript, drizzle select, drizzle
  insert, drizzle postgres, drizzle sqlite, drizzle transaction, drizzle upsert,
  drizzle prepared, drizzle config, drizzle-kit, pgTable, sqliteTable
license: MIT
---

# Drizzle ORM Best Practices

Lightweight, SQL-like, type-safe ORM -- no code generation, no build step. Patterns ordered by impact. Every section shows WRONG vs RIGHT code.

---

## 1. Schema Definition

Drizzle does NOT auto-index foreign keys. You must define indexes explicitly or queries joining on FK columns will do full table scans.

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const menuItems = sqliteTable('menu_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  basePriceCents: integer('base_price_cents').notNull(),  // Money as integer cents, NEVER real/float
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => ({
  categoryIdx: index('idx_menu_items_category').on(table.category),
}));

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerName: text('customer_name').notNull(),
  status: text('status', { enum: ['received', 'preparing', 'ready', 'picked_up', 'cancelled'] })
    .default('received').notNull(),
  totalCents: integer('total_cents').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => ({
  statusIdx: index('idx_orders_status').on(table.status),
  createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
}));

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id),
  size: text('size').notNull(),
  quantity: integer('quantity').notNull().default(1),
  priceCents: integer('price_cents').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
}, (table) => ({
  orderIdIdx: index('idx_order_items_order_id').on(table.orderId),
  menuItemIdIdx: index('idx_order_items_menu_item_id').on(table.menuItemId),
}));
```

### PostgreSQL variant

```typescript
// For PostgreSQL, use pgTable from 'drizzle-orm/pg-core'
import { pgTable, serial, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  status: text('status', { enum: ['received', 'preparing', 'ready', 'picked_up', 'cancelled'] })
    .default('received').notNull(),
  totalCents: integer('total_cents').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('idx_orders_status').on(table.status),
  createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
}));
```

### Key schema rules

- **`index()` on EVERY foreign key column** -- Drizzle does NOT auto-index FKs. Without explicit indexes, joins and lookups on FK columns scan the full table. Define indexes in the third-argument callback of every table that has FK columns.
- **`index()` on filtered/sorted columns** -- status, category, createdAt, and any column used in WHERE or ORDER BY should have an index.
- **`references()` with explicit `onDelete`** -- Always specify `{ onDelete: 'cascade' }` (or 'restrict', 'set null') on FK references. Without it, the default behavior depends on the database and orphaned rows can accumulate.
- **Money as `integer` (cents), NEVER `real`/`float`** -- Floating point causes rounding errors (0.1 + 0.2 !== 0.3). Store cents as integers.
- **Enums via `text('col', { enum: [...] })`** -- Provides TypeScript type narrowing. For PostgreSQL, you can also use `pgEnum`.
- **`createdAt` and `updatedAt` on EVERY table** -- Include timestamp columns on all tables, including join/pivot tables. Use SQL expressions for defaults: `sql\`(datetime('now'))\`` (SQLite) or `.defaultNow()` (PostgreSQL).
- **`updatedAt` on ALL mutable tables** -- Not just the "main" tables. Join tables, pivot tables, and any table that gets updates needs updatedAt.
- **Schema in `src/db/schema.ts`** -- Keep all table definitions in a single schema file (or `src/db/schema/` directory for large projects). This is where drizzle-kit looks by default.

---

## 2. Relations (Query API)

Drizzle has two query APIs. The SQL-like API (`db.select().from()`) handles joins manually. The **query API** (`db.query.table.findMany()`) uses relations for eager loading -- but only if you define `relations()` objects.

### WRONG -- no relations defined, must manually join every time
```typescript
// Without relations, you can only use the SQL-like API with manual joins
const result = await db.select()
  .from(orders)
  .leftJoin(orderItems, eq(orders.id, orderItems.orderId));
// Returns flat rows: { orders: {...}, order_items: {...} } -- you must reshape manually
```

### RIGHT -- define relations, use the query API for nested data
```typescript
import { relations } from 'drizzle-orm';

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

// Now use the query API for nested eager loading
const orderWithItems = await db.query.orders.findFirst({
  where: eq(orders.id, orderId),
  with: {
    items: {
      with: { menuItem: true },
    },
  },
});
// Returns: { id, customerName, ..., items: [{ id, size, ..., menuItem: { name, ... } }] }
```

### When to use which API
- **`db.select().from()`** -- aggregations, complex joins, subqueries, raw SQL fragments. Returns flat rows.
- **`db.query.table.findMany()`** -- detail views with nested relations, eager loading. Returns nested objects. Requires `relations()` to be defined.
- **Define `relations()` for every table with foreign keys** -- even if you mostly use the SQL-like API. The query API is far more ergonomic for detail views.

---

## 3. Migrations (drizzle-kit)

### WRONG -- old/deprecated drizzle-kit syntax
```typescript
// drizzle.config.ts -- WRONG: uses legacy 'driver' field
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite',  // WRONG: 'driver' was replaced by 'dialect'
};
```

```bash
# WRONG: old dialect-suffixed command syntax
npx drizzle-kit generate:sqlite   # WRONG: removed, use 'generate'
npx drizzle-kit push:sqlite       # WRONG: removed, use 'push'
```

### RIGHT -- current drizzle-kit configuration and commands
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',              // 'sqlite' | 'postgresql' | 'mysql'
  dbCredentials: {
    url: './data.db',             // For PostgreSQL: url: process.env.DATABASE_URL!
  },
});
```

```bash
# Generate migration SQL from schema changes
npx drizzle-kit generate

# Apply pending migrations to the database
npx drizzle-kit migrate

# Prototyping ONLY: push schema directly (no migration files created)
npx drizzle-kit push
```

### Key migration rules
- **`dialect`, not `driver`** -- The `driver` field was removed. Use `dialect: 'sqlite'` | `'postgresql'` | `'mysql'`.
- **`defineConfig()`** -- Import from `drizzle-kit` for type-safe config.
- **`generate` then `migrate`** -- `generate` creates SQL migration files in the `out` directory. `migrate` applies them. Use `push` only for rapid prototyping.
- **Commit migration files to git** -- Migration files in the `out` directory are the source of truth for schema changes. Always commit them.
- **Never edit generated SQL manually** -- If you need to change a migration, delete it and regenerate.

---

## 4. Queries (SQL-like API)

```typescript
import { db } from './db';
import { orders, orderItems, menuItems } from './schema';
import { eq, and, inArray, desc, asc, gt, lt, isNull, sql } from 'drizzle-orm';

// Select with filter and explicit ordering
const activeOrders = await db.select()
  .from(orders)
  .where(inArray(orders.status, ['received', 'preparing']))
  .orderBy(desc(orders.createdAt));

// Join with explicit eq()
const orderWithItems = await db.select()
  .from(orders)
  .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
  .where(eq(orders.id, orderId));

// Insert with returning (destructure the array)
const [newOrder] = await db.insert(orders)
  .values({ customerName: 'John', totalCents: 1250, status: 'received' })
  .returning();

// Batch insert -- single INSERT for multiple rows
await db.insert(orderItems).values([
  { orderId: newOrder.id, menuItemId: 1, size: 'large', quantity: 2, priceCents: 500 },
  { orderId: newOrder.id, menuItemId: 3, size: 'medium', quantity: 1, priceCents: 250 },
]);

// Update with SQL timestamp expression
await db.update(orders)
  .set({ status: 'preparing', updatedAt: sql`datetime('now')` })
  .where(eq(orders.id, orderId));

// Delete
await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
```

### Key query rules
- **Always use operator helpers** -- `eq()`, `and()`, `inArray()`, `gt()`, `lt()`, `desc()`, `asc()` from `'drizzle-orm'`. Never use raw SQL strings for WHERE/ORDER BY.
- **Destructure `.returning()` result** -- `const [row] = await db.insert(...).returning()` -- the result is always an array.
- **Use `desc()`/`asc()` for ORDER BY** -- Not bare column references. `orderBy(desc(orders.createdAt))` not `orderBy(orders.createdAt)`.
- **Batch inserts with `.values([...])`** -- Pass an array to insert multiple rows in a single SQL statement.
- **Update `updatedAt` with SQL expressions** -- Use `sql\`datetime('now')\`` (SQLite) or `sql\`now()\`` (PostgreSQL), not JavaScript `new Date()`.

---

## 5. Upserts (onConflictDoUpdate)

### WRONG -- check-then-insert (race condition)
```typescript
const existing = await db.select().from(users).where(eq(users.email, email));
if (existing.length > 0) {
  await db.update(users).set({ name }).where(eq(users.email, email));
} else {
  await db.insert(users).values({ email, name });
}
```

### RIGHT -- atomic upsert with onConflictDoUpdate
```typescript
await db.insert(users)
  .values({ email, name, updatedAt: sql`datetime('now')` })
  .onConflictDoUpdate({
    target: users.email,  // The unique/PK column(s) to match on
    set: {
      name: sql`excluded.name`,  // 'excluded' refers to the row that would have been inserted
      updatedAt: sql`datetime('now')`,
    },
  });

// Batch upsert -- pass an array to .values() for bulk operations
await db.insert(products)
  .values(feedItems.map(item => ({
    sku: item.sku,
    name: item.name,
    quantity: item.quantity,
    priceCents: item.priceCents,
    updatedAt: sql`datetime('now')`,
  })))
  .onConflictDoUpdate({
    target: products.sku,
    set: {
      name: sql`excluded.name`,
      quantity: sql`excluded.quantity`,
      priceCents: sql`excluded.price_cents`,
      updatedAt: sql`datetime('now')`,
    },
  });

// onConflictDoNothing -- skip if duplicate
await db.insert(users)
  .values({ email, name })
  .onConflictDoNothing({ target: users.email });
```

---

## 6. Transactions

```typescript
// Multi-table write -- MUST use tx parameter, not db
const order = await db.transaction(async (tx) => {
  const [created] = await tx.insert(orders)
    .values({ customerName, totalCents, status: 'received' })
    .returning();

  await tx.insert(orderItems).values(
    items.map(item => ({
      orderId: created.id,
      menuItemId: item.menuItemId,
      size: item.size,
      quantity: item.quantity,
      priceCents: item.priceCents,
    }))
  );

  return created;
});
```

### Key transaction rules
- **Use `tx` for ALL operations inside the transaction** -- Using the outer `db` object inside `db.transaction(async (tx) => { ... })` runs those operations OUTSIDE the transaction.
- **Return values from the callback** -- The transaction callback's return value becomes the resolved value of the transaction promise.
- **Destructure `.returning()` inside transactions too** -- `const [created] = await tx.insert(...).returning()`.

---

## 7. Prepared Statements

For frequently-executed queries, prepared statements avoid re-parsing on every call.

```typescript
import { eq } from 'drizzle-orm';
import { placeholder } from 'drizzle-orm';

// Define once
const getOrderById = db.query.orders.findFirst({
  where: eq(orders.id, placeholder('id')),
  with: { items: true },
}).prepare();

// Execute many times -- reuses the prepared plan
const order = await getOrderById.execute({ id: 42 });
```

---

## 8. Type Inference

Drizzle provides type helpers to extract TypeScript types from your schema -- no manual interface duplication needed.

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { orders } from './schema';

// Select type: all columns, all required
type Order = InferSelectModel<typeof orders>;

// Insert type: id/defaults are optional
type NewOrder = InferInsertModel<typeof orders>;

// Use in function signatures
export async function createOrder(data: NewOrder): Promise<Order> {
  const [created] = await db.insert(orders).values(data).returning();
  return created;
}
```

---

## 9. Connection Setup

### SQLite (better-sqlite3)
```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('./data.db');
sqlite.pragma('journal_mode = WAL');        // Enable WAL mode for concurrent reads
sqlite.pragma('foreign_keys = ON');          // SQLite has foreign keys OFF by default!
export const db = drizzle(sqlite, { schema });
```

### PostgreSQL (postgres.js -- recommended for production)
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!, {
  max: 10,                          // Connection pool size
  idle_timeout: 20,                 // Close idle connections after 20s
  connect_timeout: 10,              // Fail if connection takes >10s
});
export const db = drizzle(client, { schema });
```

### Key connection rules
- **Pass `{ schema }` to `drizzle()`** -- Required for the query API (`db.query.*`) to work. Without it, only the SQL-like API is available.
- **SQLite: enable `foreign_keys = ON`** -- SQLite has foreign key enforcement OFF by default. Without this pragma, `references()` constraints are ignored.
- **SQLite: enable `journal_mode = WAL`** -- Write-Ahead Logging allows concurrent readers during writes.
- **PostgreSQL: configure pool size** -- Default `postgres()` creates unlimited connections. Always set `max` to prevent exhausting the database connection limit.

---

## Checklist

- [ ] Schema in `src/db/schema.ts` with proper types and constraints
- [ ] `index()` on EVERY foreign key column (Drizzle does NOT auto-index)
- [ ] `index()` on filtered/sorted columns (status, category, createdAt)
- [ ] Money as `integer` (cents), never `real`/`float`
- [ ] Enum values via `text('col', { enum: [...] })`
- [ ] `references()` with explicit `onDelete` action on every FK
- [ ] `createdAt` and `updatedAt` on ALL tables including join/pivot tables
- [ ] `updatedAt` set with SQL expression on updates, not JavaScript Date
- [ ] `relations()` defined for every table with foreign keys
- [ ] `drizzle.config.ts` uses `dialect` (not `driver`) and `defineConfig()`
- [ ] `npx drizzle-kit generate` then `npx drizzle-kit migrate` (not old `:dialect` suffix)
- [ ] Migration files committed to git
- [ ] Transactions use `tx` parameter, not outer `db`
- [ ] `.returning()` result destructured as array
- [ ] `onConflictDoUpdate` for upserts, not check-then-insert
- [ ] Operator helpers (`eq`, `desc`, `inArray`, etc.) from 'drizzle-orm' for all conditions
- [ ] `InferSelectModel`/`InferInsertModel` for type extraction
- [ ] Pass `{ schema }` to `drizzle()` to enable query API
- [ ] SQLite: `foreign_keys = ON` pragma (off by default!)
- [ ] SQLite: `journal_mode = WAL` for concurrent access

## Verifiers

- [drizzle-schema](../../verifiers/drizzle-schema.json) -- Schema definition with proper types, indexes, and references
- [drizzle-queries-transactions](../../verifiers/drizzle-queries-transactions.json) -- Queries, transactions, upserts, and data access patterns
- [drizzle-migrations-config](../../verifiers/drizzle-migrations-config.json) -- Migration setup and drizzle-kit configuration
