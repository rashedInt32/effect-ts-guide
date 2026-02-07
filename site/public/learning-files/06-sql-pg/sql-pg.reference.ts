/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * @effect/sql-pg - REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * @effect/sql-pg provides type-safe PostgreSQL database access with Effect.
 * Connection pooling, transactions, and tagged template queries included.
 *
 * WHY @effect/sql-pg?
 * - Type-safe queries with tagged templates
 * - Automatic connection pooling
 * - Transaction support
 * - Works seamlessly with Effect's error handling
 * - Automatic resource cleanup
 *
 * REAL EXAMPLE: api/src/Layers/DatabaseLayer.ts, api/src/migrate.ts
 *
 * DOCS: https://effect.website/docs/sql
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { SqlClient, SqlError } from "@effect/sql"
import { PgClient } from "@effect/sql-pg"
import { Config, Context, Effect, Layer, Redacted, Schema } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Setting Up the Database Layer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PgClient.layerConfig - Create a PostgreSQL connection pool layer
 *
 * This is the recommended way to set up database access.
 * Reads config from environment variables and creates a connection pool.
 */

// Simple setup - just URL
const simpleDbLayer = PgClient.layerConfig(
  Config.map(Config.redacted("DATABASE_URL"), (url) => ({ url }))
)

// Full setup with all options
const fullDbLayer = PgClient.layerConfig(
  Config.map(
    Config.all({
      url: Config.redacted("DATABASE_URL"),
      maxConnections: Config.integer("DB_MAX_CONNECTIONS").pipe(
        Config.orElse(() => Config.succeed(10))
      ),
      idleTimeout: Config.integer("DB_IDLE_TIMEOUT").pipe(
        Config.orElse(() => Config.succeed(30000))
      ),
    }),
    ({ url, maxConnections, idleTimeout }) => ({
      url,
      maxConnections,
      idleTimeout,
      ssl: true, // Required for Neon, Supabase, etc.
      // Transform column names between DB and JS
      transformResultNames: snakeToCamel,
      transformQueryNames: camelToSnake,
    })
  )
)

// Helper functions for name transformation
const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

const camelToSnake = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Basic Queries with Tagged Templates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SqlClient.SqlClient - The database client service
 *
 * Use tagged template literals (sql`...`) for type-safe queries.
 * Values are automatically parameterized (no SQL injection!).
 */

// Basic SELECT query
const getAllUsers = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  // Tagged template - parameters are safe
  const users = yield* sql<{ id: string; name: string; email: string }>`
    SELECT id, name, email FROM users
  `

  return users
})

// Query with parameters
const getUserById = (userId: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    // ${userId} is automatically parameterized - safe from injection
    const users = yield* sql<{ id: string; name: string; email: string }>`
      SELECT id, name, email FROM users WHERE id = ${userId}
    `

    return users[0] ?? null
  })

// Query with multiple parameters
const searchUsers = (namePattern: string, limit: number) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const users = yield* sql<{ id: string; name: string }>`
      SELECT id, name 
      FROM users 
      WHERE name ILIKE ${`%${namePattern}%`}
      LIMIT ${limit}
    `

    return users
  })

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: INSERT, UPDATE, DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutations return affected rows by default.
 * Use RETURNING to get inserted/updated data.
 */

// INSERT with RETURNING
const createUser = (name: string, email: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const [user] = yield* sql<{ id: string; name: string; email: string }>`
      INSERT INTO users (id, name, email, created_at)
      VALUES (${crypto.randomUUID()}, ${name}, ${email}, NOW())
      RETURNING id, name, email
    `

    return user
  })

// UPDATE with RETURNING
const updateUserEmail = (userId: string, newEmail: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const [user] = yield* sql<{ id: string; email: string }>`
      UPDATE users 
      SET email = ${newEmail}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email
    `

    return user ?? null
  })

// DELETE
const deleteUser = (userId: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    // Just execute, no return
    yield* sql`DELETE FROM users WHERE id = ${userId}`
  })

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: sql.unsafe - Raw SQL Execution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sql.unsafe(query) - Execute raw SQL strings
 *
 * Use ONLY for:
 * - DDL statements (CREATE TABLE, etc.)
 * - Migration scripts
 * - Dynamic table/column names (be VERY careful!)
 *
 * NEVER use for user input!
 */

const runMigration = (sqlContent: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    // For migrations and DDL - no parameterization
    yield* sql.unsafe(sqlContent)
  })

const createTable = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE
    )
  `)
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: Transactions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sql.withTransaction - Execute multiple queries atomically
 *
 * If any query fails, all changes are rolled back.
 */

const transferFunds = (fromId: string, toId: string, amount: number) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    // Everything inside is atomic
    yield* sql.withTransaction(
      Effect.gen(function* () {
        // Debit from source
        yield* sql`
          UPDATE accounts 
          SET balance = balance - ${amount}
          WHERE id = ${fromId} AND balance >= ${amount}
        `

        // Credit to destination
        yield* sql`
          UPDATE accounts 
          SET balance = balance + ${amount}
          WHERE id = ${toId}
        `

        // Record the transfer
        yield* sql`
          INSERT INTO transfers (from_id, to_id, amount, created_at)
          VALUES (${fromId}, ${toId}, ${amount}, NOW())
        `
      })
    )
  })

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: Building a Repository
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATTERN: Repository as a Service
 *
 * Wrap database access in a service layer for:
 * - Business logic separation
 * - Easy testing with mock implementations
 * - Type safety with domain models
 */

// Domain types
const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type

class User extends Schema.Class<User>("User")({
  id: UserId,
  name: Schema.String,
  email: Schema.String,
  createdAt: Schema.Date,
}) {}

class UserNotFound extends Schema.TaggedError<UserNotFound>()("UserNotFound", {
  id: UserId,
}) {}

// Repository service
class UserRepo extends Context.Tag("@app/UserRepo")<
  UserRepo,
  {
    readonly create: (data: { name: string; email: string }) => Effect.Effect<User, SqlError.SqlError>
    readonly findById: (id: UserId) => Effect.Effect<User, UserNotFound | SqlError.SqlError>
    readonly findByEmail: (email: string) => Effect.Effect<User | null, SqlError.SqlError>
    readonly update: (
      id: UserId,
      data: Partial<{ name: string; email: string }>
    ) => Effect.Effect<User, UserNotFound | SqlError.SqlError>
    readonly delete: (id: UserId) => Effect.Effect<void, SqlError.SqlError>
  }
>() {
  // Production layer - uses real database
  static readonly layer = Layer.effect(
    UserRepo,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient

      const create = Effect.fn("UserRepo.create")(function* (data: {
        name: string
        email: string
      }) {
        const id = UserId.make(crypto.randomUUID())

        const [row] = yield* sql<{
          id: string
          name: string
          email: string
          createdAt: Date
        }>`
          INSERT INTO users (id, name, email, created_at)
          VALUES (${id}, ${data.name}, ${data.email}, NOW())
          RETURNING id, name, email, created_at as "createdAt"
        `

        if (!row) {
          return yield* Effect.die(new Error("Insert failed"))
        }

        return User.make({
          id: UserId.make(row.id),
          name: row.name,
          email: row.email,
          createdAt: row.createdAt,
        })
      })

      const findById = Effect.fn("UserRepo.findById")(function* (id: UserId) {
        const rows = yield* sql<{
          id: string
          name: string
          email: string
          createdAt: Date
        }>`
          SELECT id, name, email, created_at as "createdAt"
          FROM users WHERE id = ${id}
        `

        if (rows.length === 0) {
          return yield* new UserNotFound({ id })
        }

        const row = rows[0]!
        return User.make({
          id: UserId.make(row.id),
          name: row.name,
          email: row.email,
          createdAt: row.createdAt,
        })
      })

      const findByEmail = Effect.fn("UserRepo.findByEmail")(function* (
        email: string
      ) {
        const rows = yield* sql<{
          id: string
          name: string
          email: string
          createdAt: Date
        }>`
          SELECT id, name, email, created_at as "createdAt"
          FROM users WHERE email = ${email}
        `

        if (rows.length === 0) return null

        const row = rows[0]!
        return User.make({
          id: UserId.make(row.id),
          name: row.name,
          email: row.email,
          createdAt: row.createdAt,
        })
      })

      const update = Effect.fn("UserRepo.update")(function* (
        id: UserId,
        data: Partial<{ name: string; email: string }>
      ) {
        // Build dynamic update - this is a simple approach
        const sets: string[] = []
        const values: unknown[] = []

        if (data.name !== undefined) {
          values.push(data.name)
          sets.push(`name = $${values.length}`)
        }
        if (data.email !== undefined) {
          values.push(data.email)
          sets.push(`email = $${values.length}`)
        }

        if (sets.length === 0) {
          return yield* findById(id)
        }

        // For complex dynamic queries, you might need sql.unsafe carefully
        // This is a simplified example
        const rows = yield* sql<{
          id: string
          name: string
          email: string
          createdAt: Date
        }>`
          UPDATE users 
          SET name = COALESCE(${data.name ?? null}, name),
              email = COALESCE(${data.email ?? null}, email),
              updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, name, email, created_at as "createdAt"
        `

        if (rows.length === 0) {
          return yield* new UserNotFound({ id })
        }

        const row = rows[0]!
        return User.make({
          id: UserId.make(row.id),
          name: row.name,
          email: row.email,
          createdAt: row.createdAt,
        })
      })

      const deleteUser = Effect.fn("UserRepo.delete")(function* (id: UserId) {
        const result = yield* sql`
          DELETE FROM users WHERE id = ${id}
        `

        // Check if any rows were deleted
        if (result.length === 0) {
          // This is approximate - in real code you'd check affected rows
          const exists = yield* sql`SELECT 1 FROM users WHERE id = ${id}`
          if (exists.length === 0) {
            // Already deleted or never existed - that's fine for delete
          }
        }
      })

      return UserRepo.of({
        create,
        findById,
        findByEmail,
        update,
        delete: deleteUser,
      })
    })
  )

  // Test layer - in-memory
  static readonly testLayer = Layer.sync(UserRepo, () => {
    const store = new Map<UserId, User>()

    return UserRepo.of({
      create: (data) =>
        Effect.sync(() => {
          const user = User.make({
            id: UserId.make(crypto.randomUUID()),
            name: data.name,
            email: data.email,
            createdAt: new Date(),
          })
          store.set(user.id, user)
          return user
        }),

      findById: (id) =>
        Effect.gen(function* () {
          const user = store.get(id)
          if (!user) return yield* new UserNotFound({ id })
          return user
        }),

      findByEmail: (email) =>
        Effect.sync(() => {
          for (const user of store.values()) {
            if (user.email === email) return user
          }
          return null
        }),

      update: (id, data) =>
        Effect.gen(function* () {
          const existing = store.get(id)
          if (!existing) return yield* new UserNotFound({ id })

          const updated = User.make({
            ...existing,
            name: data.name ?? existing.name,
            email: data.email ?? existing.email,
          })
          store.set(id, updated)
          return updated
        }),

      delete: (id) =>
        Effect.sync(() => {
          store.delete(id)
        }),
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: Complete Example - Migration Runner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A simplified migration runner pattern.
 * See api/src/migrate.ts for the full implementation.
 */

const runMigrations = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  // Create migrations tracking table
  yield* sql.unsafe(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `)

  // Get executed migrations
  const executed = yield* sql<{ name: string }>`
    SELECT name FROM _migrations ORDER BY name
  `
  const executedSet = new Set(executed.map((r) => r.name))

  yield* Effect.logInfo(`Found ${executedSet.size} executed migrations`)

  // In real code, you'd read from filesystem and run pending migrations
  // See api/src/migrate.ts for the full implementation
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: What NOT to Do (Anti-Patterns)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DON'T: Use string concatenation for queries
 */

// WRONG - SQL injection risk!
// const badQuery = (name: string) =>
//   sql.unsafe(`SELECT * FROM users WHERE name = '${name}'`)

// CORRECT - use tagged template
// const goodQuery = (name: string) =>
//   sql`SELECT * FROM users WHERE name = ${name}`

/**
 * DON'T: Create multiple database layers
 */

// WRONG - creates multiple connection pools
// const layer1 = someRepo.pipe(Layer.provide(PgClient.layerConfig(...)))
// const layer2 = otherRepo.pipe(Layer.provide(PgClient.layerConfig(...)))

// CORRECT - share a single layer
// const dbLayer = PgClient.layerConfig(...)
// const layer1 = someRepo.pipe(Layer.provide(dbLayer))
// const layer2 = otherRepo.pipe(Layer.provide(dbLayer))

/**
 * DON'T: Forget error handling
 */

// WRONG - crashes on not found
// const user = (yield* sql`SELECT * FROM users WHERE id = ${id}`)[0]

// CORRECT - handle empty results
// const rows = yield* sql`SELECT * FROM users WHERE id = ${id}`
// if (rows.length === 0) return yield* new UserNotFound({ id })

export {
  // Section 1: Setup
  simpleDbLayer,
  fullDbLayer,

  // Section 2-3: Queries
  getAllUsers,
  getUserById,
  searchUsers,
  createUser,
  updateUserEmail,
  deleteUser,

  // Section 4: Raw SQL
  runMigration,
  createTable,

  // Section 5: Transactions
  transferFunds,

  // Section 6: Repository
  User,
  UserId,
  UserNotFound,
  UserRepo,

  // Section 7: Migrations
  runMigrations,
}
