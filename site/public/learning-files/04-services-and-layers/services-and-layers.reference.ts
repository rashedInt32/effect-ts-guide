/**
 * =============================================================================
 * SERVICES & LAYERS - REFERENCE
 * =============================================================================
 *
 * Effect's service pattern provides type-safe dependency injection.
 * Services define contracts, Layers provide implementations.
 *
 * TABLE OF CONTENTS:
 *   1. What is a Service?
 *   2. Using Services in Effects
 *   3. What is a Layer?
 *   4. SERVICE INTERFACE DESIGN GUIDE - What methods should a service have? (NEW!)
 *   5. Complete Service Pattern (Recommended)
 *   6. Layer Composition
 *   7. Providing Layers to Effects
 *   8. Layer Memoization
 *   9. Service with Multiple Dependencies
 *   10. Complete Example - Application Layer
 *   11. Anti-Patterns
 *
 * DOCS: https://effect.website/docs/requirements-management
 *
 * =============================================================================
 */

import { Context, Effect, Layer, Schema } from "effect"

// =============================================================================
// SECTION 1: What is a Service?
// =============================================================================

/**
 * Context.Tag - Define a service interface
 *
 * A service declares:
 * 1. A unique identifier (e.g., "@app/Logger")
 * 2. An interface describing methods
 *
 * The actual implementation comes later through Layers.
 */

// Simple logging service
class Logger extends Context.Tag("@app/Logger")<
  Logger,
  {
    readonly info: (message: string) => Effect.Effect<void>
    readonly error: (message: string, error?: unknown) => Effect.Effect<void>
    readonly debug: (message: string) => Effect.Effect<void>
  }
>() {}

// Database service
class Database extends Context.Tag("@app/Database")<
  Database,
  {
    readonly query: <T>(sql: string) => Effect.Effect<T[]>
    readonly execute: (sql: string) => Effect.Effect<void>
  }
>() {}

// =============================================================================
// SECTION 2: Using Services in Effects
// =============================================================================

/**
 * To use a service, yield* the Tag in an Effect.gen block.
 * The type system tracks which services are required.
 */

// This effect REQUIRES Logger service
const logMessage = Effect.gen(function* () {
  const logger = yield* Logger
  yield* logger.info("Hello from Effect!")
})
// Type: Effect<void, never, Logger>
//                           ^^^^^^ Requires Logger

// This effect requires BOTH Logger and Database
const queryWithLogging = Effect.gen(function* () {
  const logger = yield* Logger
  const db = yield* Database

  yield* logger.info("Running query...")
  const users = yield* db.query<{ id: string; name: string }>("SELECT * FROM users")
  yield* logger.info(`Found ${users.length} users`)

  return users
})
// Type: Effect<{...}[], never, Logger | Database>

// =============================================================================
// SECTION 3: What is a Layer?
// =============================================================================

/**
 * Layer = Implementation of a service
 *
 * Layer<Provides, Error, Requires>
 * - Provides: What service this layer creates
 * - Error: What errors can occur during setup
 * - Requires: What other services this layer needs
 */

// Simple layer - no dependencies
const consoleLogger = Layer.succeed(Logger, {
  info: (msg) => Effect.logInfo(msg),
  error: (msg, err) => Effect.logError(msg, err),
  debug: (msg) => Effect.logDebug(msg),
})
// Type: Layer<Logger, never, never>

// Layer with setup logic
const fileLogger = Layer.effect(
  Logger,
  Effect.gen(function* () {
    yield* Effect.logInfo("Setting up file logger...")

    return Logger.of({
      info: (msg) => Effect.sync(() => console.log(`[INFO] ${msg}`)),
      error: (msg, err) => Effect.sync(() => console.error(`[ERROR] ${msg}`, err)),
      debug: (msg) => Effect.sync(() => console.log(`[DEBUG] ${msg}`)),
    })
  })
)

// =============================================================================
// SECTION 4: SERVICE INTERFACE DESIGN GUIDE
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    HOW TO DESIGN SERVICE INTERFACES                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  The hardest question: "What methods should my service have?"             ║
 * ║                                                                           ║
 * ║  THINK IN TERMS OF:                                                       ║
 * ║  1. REPOSITORY (data access) - CRUD operations                            ║
 * ║  2. SERVICE (business logic) - Use cases / workflows                      ║
 * ║  3. GATEWAY (external systems) - Adapters to external APIs                ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 4a. REPOSITORY Pattern - Data Access Layer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Repositories handle CRUD operations for a single entity type.
 *
 * STANDARD METHODS (pick what you need):
 *
 *   CREATE:
 *     create(data)              → Effect<Entity>
 *     createMany(data[])        → Effect<Entity[]>
 *
 *   READ:
 *     findById(id)              → Effect<Entity, NotFoundError>
 *     findByIdOrNull(id)        → Effect<Entity | null>
 *     findOne(criteria)         → Effect<Entity | null>
 *     findMany(criteria)        → Effect<Entity[]>
 *     all()                     → Effect<Entity[]>
 *     count(criteria?)          → Effect<number>
 *     exists(id)                → Effect<boolean>
 *
 *   UPDATE:
 *     update(id, data)          → Effect<Entity, NotFoundError>
 *     updateMany(criteria,data) → Effect<number>  (affected count)
 *
 *   DELETE:
 *     delete(id)                → Effect<void, NotFoundError>
 *     deleteMany(criteria)      → Effect<number>  (deleted count)
 *     softDelete(id)            → Effect<void, NotFoundError>
 *
 * NAMING CONVENTION:
 *   - findById:       Returns entity OR fails with NotFound
 *   - findByIdOrNull: Returns entity OR null (no error)
 *   - findOne:        Returns first match OR null
 *   - findMany:       Returns array (possibly empty)
 */

// Branded IDs
const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type

const ExpenseId = Schema.String.pipe(Schema.brand("ExpenseId"))
type ExpenseId = typeof ExpenseId.Type

const CategoryId = Schema.String.pipe(Schema.brand("CategoryId"))
type CategoryId = typeof CategoryId.Type

// Domain models
class User extends Schema.Class<User>("User")({
  id: UserId,
  name: Schema.String,
  email: Schema.String,
}) {}

class Expense extends Schema.Class<Expense>("Expense")({
  id: ExpenseId,
  userId: UserId,
  categoryId: CategoryId,
  amount: Schema.Number,
  description: Schema.String,
  date: Schema.Date,
  createdAt: Schema.Date,
}) {}

// Error types
class UserNotFound extends Schema.TaggedError<UserNotFound>()("UserNotFound", {
  id: UserId,
}) {}

class ExpenseNotFound extends Schema.TaggedError<ExpenseNotFound>()(
  "ExpenseNotFound",
  { id: ExpenseId }
) {}

// ─────────────────────────────────────────────────────────────────────────────
// Example: User Repository Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * UserRepository - Data access for User entity
 *
 * Notice: NO business logic here! Just data operations.
 */
class UserRepository extends Context.Tag("@app/UserRepository")<
  UserRepository,
  {
    // CREATE
    readonly create: (data: { name: string; email: string }) => Effect.Effect<User>

    // READ
    readonly findById: (id: UserId) => Effect.Effect<User, UserNotFound>
    readonly findByIdOrNull: (id: UserId) => Effect.Effect<User | null>
    readonly findByEmail: (email: string) => Effect.Effect<User | null>
    readonly all: () => Effect.Effect<readonly User[]>
    readonly count: () => Effect.Effect<number>

    // UPDATE
    readonly update: (
      id: UserId,
      data: Partial<{ name: string; email: string }>
    ) => Effect.Effect<User, UserNotFound>

    // DELETE
    readonly delete: (id: UserId) => Effect.Effect<void, UserNotFound>
  }
>() {}

// ─────────────────────────────────────────────────────────────────────────────
// Example: Expense Repository Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ExpenseRepository - Data access for Expense entity
 *
 * Note: Has query methods specific to the domain.
 */
class ExpenseRepository extends Context.Tag("@app/ExpenseRepository")<
  ExpenseRepository,
  {
    // CREATE
    readonly create: (data: {
      userId: UserId
      categoryId: CategoryId
      amount: number
      description: string
      date: Date
    }) => Effect.Effect<Expense>

    // READ - Standard
    readonly findById: (id: ExpenseId) => Effect.Effect<Expense, ExpenseNotFound>
    readonly findByIdOrNull: (id: ExpenseId) => Effect.Effect<Expense | null>

    // READ - Domain-specific queries
    readonly findByUser: (userId: UserId) => Effect.Effect<readonly Expense[]>
    readonly findByCategory: (categoryId: CategoryId) => Effect.Effect<readonly Expense[]>
    readonly findByDateRange: (
      userId: UserId,
      start: Date,
      end: Date
    ) => Effect.Effect<readonly Expense[]>

    // UPDATE
    readonly update: (
      id: ExpenseId,
      data: Partial<{
        categoryId: CategoryId
        amount: number
        description: string
        date: Date
      }>
    ) => Effect.Effect<Expense, ExpenseNotFound>

    // DELETE
    readonly delete: (id: ExpenseId) => Effect.Effect<void, ExpenseNotFound>
    readonly deleteByUser: (userId: UserId) => Effect.Effect<number>
  }
>() {}

// ─────────────────────────────────────────────────────────────────────────────
// 4b. SERVICE Pattern - Business Logic Layer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Services orchestrate business logic and use cases.
 * They typically:
 * - Use multiple repositories
 * - Enforce business rules
 * - Handle workflows
 * - Send notifications
 *
 * METHOD NAMING:
 *   - Use verbs that describe the USE CASE, not CRUD
 *   - registerUser (not createUser) - implies workflow
 *   - submitExpense (not createExpense) - implies validation
 *   - approveExpense - state change with rules
 */

// Error types for business rules
class EmailAlreadyExists extends Schema.TaggedError<EmailAlreadyExists>()(
  "EmailAlreadyExists",
  { email: Schema.String }
) {}

class InvalidExpenseAmount extends Schema.TaggedError<InvalidExpenseAmount>()(
  "InvalidExpenseAmount",
  { amount: Schema.Number, reason: Schema.String }
) {}

class ExpenseNotEditable extends Schema.TaggedError<ExpenseNotEditable>()(
  "ExpenseNotEditable",
  { id: ExpenseId, reason: Schema.String }
) {}

/**
 * UserService - Business logic for User use cases
 */
class UserService extends Context.Tag("@app/UserService")<
  UserService,
  {
    // Use case: Register a new user
    // - Validates email format
    // - Checks email doesn't exist
    // - Creates user
    // - Sends welcome email
    readonly register: (data: {
      name: string
      email: string
    }) => Effect.Effect<User, EmailAlreadyExists>

    // Use case: Get user profile with related data
    readonly getProfile: (id: UserId) => Effect.Effect<
      { user: User; expenseCount: number; totalSpent: number },
      UserNotFound
    >

    // Use case: Deactivate account
    // - Soft deletes user
    // - Cancels subscriptions
    // - Notifies
    readonly deactivate: (id: UserId) => Effect.Effect<void, UserNotFound>
  }
>() {}

/**
 * ExpenseService - Business logic for Expense use cases
 */
class ExpenseService extends Context.Tag("@app/ExpenseService")<
  ExpenseService,
  {
    // Use case: Submit a new expense
    // - Validates amount limits
    // - Validates category exists
    // - Creates expense
    // - Notifies if large amount
    readonly submit: (data: {
      userId: UserId
      categoryId: CategoryId
      amount: number
      description: string
      date: Date
    }) => Effect.Effect<Expense, UserNotFound | InvalidExpenseAmount>

    // Use case: Edit an existing expense
    // - Only allowed if not yet approved
    readonly edit: (
      id: ExpenseId,
      data: Partial<{
        categoryId: CategoryId
        amount: number
        description: string
        date: Date
      }>
    ) => Effect.Effect<Expense, ExpenseNotFound | ExpenseNotEditable>

    // Use case: Get expense report
    readonly getReport: (
      userId: UserId,
      month: number,
      year: number
    ) => Effect.Effect<
      {
        expenses: readonly Expense[]
        total: number
        byCategory: Record<string, number>
      },
      UserNotFound
    >

    // Use case: Bulk import from CSV
    readonly importFromCsv: (
      userId: UserId,
      csvData: string
    ) => Effect.Effect<{ imported: number; errors: string[] }, UserNotFound>
  }
>() {}

// ─────────────────────────────────────────────────────────────────────────────
// 4c. GATEWAY Pattern - External Systems
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gateways are adapters to external services/APIs.
 *
 * - EmailGateway - Send emails
 * - PaymentGateway - Process payments
 * - StorageGateway - File uploads
 * - NotificationGateway - Push notifications
 */

class EmailGateway extends Context.Tag("@app/EmailGateway")<
  EmailGateway,
  {
    readonly send: (params: {
      to: string
      subject: string
      body: string
      html?: string
    }) => Effect.Effect<void>

    readonly sendTemplate: (params: {
      to: string
      template: string
      data: Record<string, unknown>
    }) => Effect.Effect<void>
  }
>() {}

class StorageGateway extends Context.Tag("@app/StorageGateway")<
  StorageGateway,
  {
    readonly upload: (params: {
      key: string
      data: Uint8Array
      contentType: string
    }) => Effect.Effect<{ url: string }>

    readonly download: (key: string) => Effect.Effect<Uint8Array>

    readonly delete: (key: string) => Effect.Effect<void>

    readonly getSignedUrl: (
      key: string,
      expiresIn: number
    ) => Effect.Effect<string>
  }
>() {}

// ─────────────────────────────────────────────────────────────────────────────
// 4d. Service Design Cheat Sheet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    SERVICE DESIGN CHEAT SHEET                              ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  REPOSITORY (XxxRepository)                                               ║
 * ║  ───────────────────────────                                              ║
 * ║  Purpose: Data access for ONE entity type                                 ║
 * ║  Methods: CRUD operations                                                 ║
 * ║  Depends on: Database only                                                ║
 * ║  Example methods:                                                         ║
 * ║    create, findById, findByIdOrNull, findMany, update, delete             ║
 * ║                                                                           ║
 * ║  SERVICE (XxxService)                                                     ║
 * ║  ────────────────────                                                     ║
 * ║  Purpose: Business logic and use cases                                    ║
 * ║  Methods: Named after USE CASES (verbs)                                   ║
 * ║  Depends on: Repositories, Gateways, other Services                       ║
 * ║  Example methods:                                                         ║
 * ║    register, submit, approve, getReport, importFrom                       ║
 * ║                                                                           ║
 * ║  GATEWAY (XxxGateway)                                                     ║
 * ║  ──────────────────                                                       ║
 * ║  Purpose: Adapter to external system                                      ║
 * ║  Methods: Match external system's capabilities                            ║
 * ║  Depends on: Config, HTTP client                                          ║
 * ║  Example methods:                                                         ║
 * ║    send, upload, process, verify                                          ║
 * ║                                                                           ║
 * ║  ERROR HANDLING:                                                          ║
 * ║  ───────────────                                                          ║
 * ║  Repository errors: NotFound, DatabaseError                               ║
 * ║  Service errors: Business rule violations                                 ║
 * ║  Gateway errors: External system failures                                 ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// SECTION 5: Complete Service Pattern (Recommended)
// =============================================================================

/**
 * BEST PRACTICE: Define services as classes with static layer properties.
 */

class Users extends Context.Tag("@app/Users")<
  Users,
  {
    readonly create: (data: { name: string; email: string }) => Effect.Effect<User>
    readonly findById: (id: UserId) => Effect.Effect<User, UserNotFound>
    readonly findByEmail: (email: string) => Effect.Effect<User | null>
    readonly all: () => Effect.Effect<readonly User[]>
  }
>() {
  // Production layer - uses database
  static readonly layer = Layer.effect(
    Users,
    Effect.gen(function* () {
      const db = yield* Database

      const create = Effect.fn("Users.create")(function* (data: {
        name: string
        email: string
      }) {
        const id = UserId.make(crypto.randomUUID())
        yield* db.execute(
          `INSERT INTO users (id, name, email) VALUES ('${id}', '${data.name}', '${data.email}')`
        )
        return User.make({ id, name: data.name, email: data.email })
      })

      const findById = Effect.fn("Users.findById")(function* (id: UserId) {
        const users = yield* db.query<{ id: string; name: string; email: string }>(
          `SELECT * FROM users WHERE id = '${id}'`
        )
        if (users.length === 0) {
          return yield* new UserNotFound({ id })
        }
        const user = users[0]!
        return User.make({
          id: UserId.make(user.id),
          name: user.name,
          email: user.email,
        })
      })

      const findByEmail = Effect.fn("Users.findByEmail")(function* (email: string) {
        const users = yield* db.query<{ id: string; name: string; email: string }>(
          `SELECT * FROM users WHERE email = '${email}'`
        )
        if (users.length === 0) return null
        const user = users[0]!
        return User.make({
          id: UserId.make(user.id),
          name: user.name,
          email: user.email,
        })
      })

      const all = Effect.fn("Users.all")(function* () {
        const users = yield* db.query<{ id: string; name: string; email: string }>(
          "SELECT * FROM users"
        )
        return users.map((u) =>
          User.make({ id: UserId.make(u.id), name: u.name, email: u.email })
        )
      })

      return Users.of({ create, findById, findByEmail, all })
    })
  )

  // Test layer - in-memory store
  static readonly testLayer = Layer.sync(Users, () => {
    const store = new Map<UserId, User>()

    const create = (data: { name: string; email: string }) =>
      Effect.sync(() => {
        const user = User.make({
          id: UserId.make(crypto.randomUUID()),
          name: data.name,
          email: data.email,
        })
        store.set(user.id, user)
        return user
      })

    const findById = (id: UserId) =>
      Effect.gen(function* () {
        const user = store.get(id)
        if (!user) return yield* new UserNotFound({ id })
        return user
      })

    const findByEmail = (email: string) =>
      Effect.sync(() => {
        for (const user of store.values()) {
          if (user.email === email) return user
        }
        return null
      })

    const all = () => Effect.sync(() => [...store.values()])

    return Users.of({ create, findById, findByEmail, all })
  })
}

// =============================================================================
// SECTION 6: Layer Composition
// =============================================================================

// Mock database layer for testing
const mockDatabase = Layer.succeed(Database, {
  query: <T>(_sql: string) => Effect.succeed([] as T[]),
  execute: (_sql: string) => Effect.void,
})

// Compose layers: Users.layer needs Database
const usersWithDb = Users.layer.pipe(Layer.provide(mockDatabase))

// Combine multiple layers
const appLayer = Layer.mergeAll(consoleLogger, usersWithDb)

// Use Layer.provideMerge to provide AND expose dependencies
const testLayer = Users.testLayer.pipe(Layer.provideMerge(consoleLogger))

// =============================================================================
// SECTION 7: Providing Layers to Effects
// =============================================================================

/**
 * Effect.provide - Supply layers to satisfy requirements
 *
 * BEST PRACTICE: Provide ONCE at the top of your application.
 */

const program = Effect.gen(function* () {
  const logger = yield* Logger
  const users = yield* Users

  yield* logger.info("Creating user...")
  const user = yield* users.create({ name: "Alice", email: "alice@example.com" })
  yield* logger.info(`Created user: ${user.id}`)

  return user
})
// Type: Effect<User, never, Logger | Users>

// Provide layers at entry point
const runnable = program.pipe(Effect.provide(appLayer))
// Type: Effect<User, never, never> - No more requirements!

// =============================================================================
// SECTION 8: Layer Memoization
// =============================================================================

/**
 * Effect automatically memoizes layers by reference identity.
 * When the same layer instance appears multiple times, it's constructed only once.
 */

// WRONG: Creates TWO database pools!
// const badLayer = Layer.merge(
//   UserRepo.layer.pipe(Layer.provide(Database.layer())),  // New instance
//   OrderRepo.layer.pipe(Layer.provide(Database.layer()))  // New instance
// )

// CORRECT: Creates ONE database pool, shared
// const dbLayer = Database.layer()  // Store in constant
// const goodLayer = Layer.merge(
//   UserRepo.layer.pipe(Layer.provide(dbLayer)),
//   OrderRepo.layer.pipe(Layer.provide(dbLayer))
// )

// =============================================================================
// SECTION 9: Service with Multiple Dependencies
// =============================================================================

class Emails extends Context.Tag("@app/Emails")<
  Emails,
  {
    readonly send: (to: string, subject: string, body: string) => Effect.Effect<void>
  }
>() {
  static readonly testLayer = Layer.sync(Emails, () => {
    const sent: Array<{ to: string; subject: string; body: string }> = []
    return Emails.of({
      send: (to, subject, body) =>
        Effect.sync(() => {
          sent.push({ to, subject, body })
          console.log(`[TEST] Email sent to ${to}: ${subject}`)
        }),
    })
  })
}

// Expenses service depends on Users, Database, and Emails
class Expenses extends Context.Tag("@app/Expenses")<
  Expenses,
  {
    readonly create: (data: {
      userId: UserId
      amount: number
      description: string
    }) => Effect.Effect<Expense, UserNotFound>
    readonly findById: (id: ExpenseId) => Effect.Effect<Expense, ExpenseNotFound>
    readonly notifyUser: (expense: Expense) => Effect.Effect<void, UserNotFound>
  }
>() {
  static readonly layer = Layer.effect(
    Expenses,
    Effect.gen(function* () {
      const users = yield* Users
      const emails = yield* Emails
      const db = yield* Database

      const create = Effect.fn("Expenses.create")(function* (data: {
        userId: UserId
        amount: number
        description: string
      }) {
        yield* users.findById(data.userId)

        const expense = Expense.make({
          id: ExpenseId.make(crypto.randomUUID()),
          userId: data.userId,
          categoryId: CategoryId.make("default"),
          amount: data.amount,
          description: data.description,
          date: new Date(),
          createdAt: new Date(),
        })

        yield* db.execute(`INSERT INTO expenses ...`)
        return expense
      })

      const findById = Effect.fn("Expenses.findById")(function* (id: ExpenseId) {
        const rows = yield* db.query<{
          id: string
          userId: string
          amount: number
          description: string
        }>(`SELECT * FROM expenses WHERE id = '${id}'`)

        if (rows.length === 0) {
          return yield* new ExpenseNotFound({ id })
        }

        const row = rows[0]!
        return Expense.make({
          id: ExpenseId.make(row.id),
          userId: UserId.make(row.userId),
          categoryId: CategoryId.make("default"),
          amount: row.amount,
          description: row.description,
          date: new Date(),
          createdAt: new Date(),
        })
      })

      const notifyUser = Effect.fn("Expenses.notifyUser")(function* (expense: Expense) {
        const user = yield* users.findById(expense.userId)
        yield* emails.send(
          user.email,
          "New Expense Created",
          `You created an expense: ${expense.description} - $${expense.amount}`
        )
      })

      return Expenses.of({ create, findById, notifyUser })
    })
  )
}

// =============================================================================
// SECTION 10: Complete Example - Application Layer
// =============================================================================

// Production layers
const productionLayer = Expenses.layer.pipe(
  Layer.provideMerge(Users.layer),
  Layer.provideMerge(Emails.testLayer),
  Layer.provideMerge(mockDatabase),
  Layer.provideMerge(consoleLogger)
)

// Test layers
const fullTestLayer = Expenses.layer.pipe(
  Layer.provideMerge(Users.testLayer),
  Layer.provideMerge(Emails.testLayer),
  Layer.provideMerge(mockDatabase),
  Layer.provideMerge(consoleLogger)
)

// Application program
const appProgram = Effect.gen(function* () {
  const logger = yield* Logger
  const users = yield* Users
  const expenses = yield* Expenses

  yield* logger.info("=== Starting Application ===")

  const user = yield* users.create({ name: "Bob", email: "bob@example.com" })
  yield* logger.info(`Created user: ${user.name}`)

  const expense = yield* expenses.create({
    userId: user.id,
    amount: 49.99,
    description: "Coffee subscription",
  })
  yield* logger.info(`Created expense: ${expense.description}`)

  yield* expenses.notifyUser(expense)

  return { user, expense }
})

const main = appProgram.pipe(Effect.provide(fullTestLayer))

// =============================================================================
// SECTION 11: Anti-Patterns
// =============================================================================

/**
 * ❌ DON'T: Scatter Effect.provide throughout code
 *
 * WRONG:
 *   const badHandler = (id: UserId) =>
 *     users.findById(id).pipe(Effect.provide(usersLayer))
 *
 * CORRECT:
 *   const main = handler.pipe(Effect.provide(appLayer))
 */

/**
 * ❌ DON'T: Create layers inside functions
 *
 * WRONG:
 *   const getUser = (id: UserId) =>
 *     Effect.gen(...).pipe(Effect.provide(Users.layer.pipe(Layer.provide(Database.layer()))))
 *
 * CORRECT:
 *   const appLayer = Users.layer.pipe(Layer.provide(dbLayer))
 *   const main = getUser(id).pipe(Effect.provide(appLayer))
 */

/**
 * ❌ DON'T: Put business logic in layers
 *
 * Layers should just wire up dependencies.
 * Business logic belongs in service methods.
 */

/**
 * ❌ DON'T: Make repositories depend on services
 *
 * Dependencies should flow: Service → Repository → Database
 * Never: Repository → Service (circular!)
 */

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Section 1-2: Services
  Logger,
  Database,
  logMessage,
  queryWithLogging,

  // Section 3: Layers
  consoleLogger,
  fileLogger,

  // Section 4: Interface design examples
  UserRepository,
  ExpenseRepository,
  UserService,
  ExpenseService,
  EmailGateway,
  StorageGateway,

  // Section 5: Complete pattern
  User,
  UserNotFound,
  Users,

  // Section 6-7: Composition
  mockDatabase,
  appLayer,
  testLayer,
  program,
  runnable,

  // Section 9: Multiple dependencies
  Expense,
  ExpenseNotFound,
  Emails,
  Expenses,

  // Section 10: Full example
  productionLayer,
  fullTestLayer,
  appProgram,
  main,
}
