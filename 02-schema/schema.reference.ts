/**
 * =============================================================================
 * EFFECT SCHEMA - REFERENCE
 * =============================================================================
 *
 * Schema is Effect's answer to runtime validation, encoding/decoding, and type safety.
 * Define once, get TypeScript types + validation + serialization for free.
 *
 * TABLE OF CONTENTS:
 *   1. Primitive Schemas - Building blocks
 *   2. Branded Types - Type-safe primitives
 *   3. DATA MODELING GUIDE - When to use what fields (NEW!)
 *   4. Schema.Class - Domain models (records)
 *   5. Schema.TaggedClass - Variants (unions)
 *   6. Decoding & Validation
 *   7. JSON Encoding/Decoding
 *   8. Transformations & Refinements
 *   9. Complete Example - Expense Domain
 *   10. Anti-Patterns
 *
 * REAL EXAMPLE: api/src/Domain/Ids.ts (branded IDs)
 * DOCS: https://effect.website/docs/schema/introduction
 *
 * =============================================================================
 */

import { Effect, Match, Option, Schema } from "effect"

// =============================================================================
// SECTION 1: Primitive Schemas - Building Blocks
// =============================================================================

/**
 * Basic primitive schemas - your building blocks.
 * Each schema is both a TypeScript type AND a runtime validator.
 */

// String schemas
const StringSchema = Schema.String
type StringType = typeof StringSchema.Type // string

// Number schemas
const NumberSchema = Schema.Number
const IntSchema = Schema.Int // Must be an integer

// Boolean
const BoolSchema = Schema.Boolean

// Date - handles Date objects
const DateSchema = Schema.Date

// Literal values - exact matches only
const StatusLiteral = Schema.Literal("pending", "active", "completed")
type Status = typeof StatusLiteral.Type // "pending" | "active" | "completed"

// Union of primitives
const StringOrNumber = Schema.Union(Schema.String, Schema.Number)
type StringOrNum = typeof StringOrNumber.Type // string | number

// Optional (returns Option<string> instead of string | undefined)
const OptionalString = Schema.optionalWith(Schema.String, { as: "Option" })

// =============================================================================
// SECTION 2: Branded Types - Type-Safe Primitives
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      WHY BRAND EVERYTHING?                                 ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  Without brands:                                                          ║
 * ║    function getUser(userId: string, tenantId: string) {...}               ║
 * ║    getUser(tenantId, userId)  // Oops! Swapped params. Compiles fine. 💥  ║
 * ║                                                                           ║
 * ║  With brands:                                                             ║
 * ║    function getUser(userId: UserId, tenantId: TenantId) {...}             ║
 * ║    getUser(tenantId, userId)  // ❌ Compile error! Types don't match.     ║
 * ║                                                                           ║
 * ║  RULE: Brand EVERY primitive in your domain that has semantic meaning.    ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 2a. Branded IDs - The Most Important Brands
// ─────────────────────────────────────────────────────────────────────────────

// Can't accidentally pass UserId where PostId is expected
export const UserId = Schema.String.pipe(Schema.brand("UserId"))
export type UserId = typeof UserId.Type

export const PostId = Schema.String.pipe(Schema.brand("PostId"))
export type PostId = typeof PostId.Type

export const ExpenseId = Schema.String.pipe(Schema.brand("ExpenseId"))
export type ExpenseId = typeof ExpenseId.Type

export const CategoryId = Schema.String.pipe(Schema.brand("CategoryId"))
export type CategoryId = typeof CategoryId.Type

// ─────────────────────────────────────────────────────────────────────────────
// 2b. Branded Domain Primitives - Beyond IDs
// ─────────────────────────────────────────────────────────────────────────────

export const Email = Schema.String.pipe(Schema.brand("Email"))
export type Email = typeof Email.Type

export const Port = Schema.Int.pipe(
  Schema.between(1, 65535),
  Schema.brand("Port")
)
export type Port = typeof Port.Type

export const Amount = Schema.Number.pipe(
  Schema.positive(),
  Schema.brand("Amount")
)
export type Amount = typeof Amount.Type

export const Currency = Schema.Literal("BDT", "USD", "EUR")
export type Currency = typeof Currency.Type

// ─────────────────────────────────────────────────────────────────────────────
// 2c. Creating Branded Values
// ─────────────────────────────────────────────────────────────────────────────

// Use .make() to create branded values
const userId = UserId.make("user-123")
const postId = PostId.make("post-456")
const email = Email.make("alice@example.com")
const port = Port.make(3000)
const amount = Amount.make(99.99)

// Type safety in action:
function getUser(_id: UserId): void {}
function getPost(_id: PostId): void {}

getUser(userId) // ✅ Works
getPost(postId) // ✅ Works
// getUser(postId)  // ❌ Error: PostId is not UserId
// getPost("raw")   // ❌ Error: string is not PostId

// =============================================================================
// SECTION 3: DATA MODELING GUIDE - The Thinking Framework
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    HOW TO THINK ABOUT SCHEMA DESIGN                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  You often need DIFFERENT schemas for the SAME concept:                   ║
 * ║                                                                           ║
 * ║  1. DATABASE SCHEMA (what's stored in DB)                                 ║
 * ║     - Has auto-generated fields (id, timestamps)                          ║
 * ║     - Has foreign keys as IDs                                             ║
 * ║     - Might have DB-specific types                                        ║
 * ║                                                                           ║
 * ║  2. API INPUT SCHEMA (what client sends to create/update)                 ║
 * ║     - NO id (generated by server)                                         ║
 * ║     - NO timestamps (generated by server)                                 ║
 * ║     - Might have validation rules                                         ║
 * ║                                                                           ║
 * ║  3. API OUTPUT SCHEMA (what client receives)                              ║
 * ║     - HAS id and timestamps                                               ║
 * ║     - Might have computed/joined fields                                   ║
 * ║     - Might exclude sensitive fields                                      ║
 * ║                                                                           ║
 * ║  4. DOMAIN MODEL (what your app code uses)                                ║
 * ║     - The "richest" version with methods                                  ║
 * ║     - Used in business logic                                              ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 3a. EXAMPLE: Designing an Expense Entity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * STEP 1: What fields does an Expense need?
 *
 * Ask yourself these questions:
 *
 * IDENTITY:
 *   - id: ExpenseId (primary key, generated by server)
 *
 * OWNERSHIP:
 *   - userId: UserId (who created this? foreign key)
 *
 * CORE DATA (what IS an expense?):
 *   - amount: Amount (how much?)
 *   - currency: Currency (in what currency?)
 *   - description: string (what was it for?)
 *   - date: Date (when did it happen?)
 *
 * CATEGORIZATION:
 *   - categoryId: CategoryId (what type of expense?)
 *   - tags: string[] (additional labels)
 *
 * STATE:
 *   - status: "pending" | "approved" | "rejected" (workflow state)
 *
 * METADATA (auto-managed):
 *   - createdAt: Date (when was record created?)
 *   - updatedAt: Date (when was record last modified?)
 *
 * OPTIONAL:
 *   - notes: Option<string> (additional details, might be empty)
 *   - receiptUrl: Option<string> (attached receipt)
 */

// ─────────────────────────────────────────────────────────────────────────────
// 3b. The Four Schemas for Expense
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SCHEMA 1: Database Row (what comes from/goes to DB)
 *
 * This matches your DB table structure exactly.
 */
const ExpenseRow = Schema.Struct({
  // Identity
  id: ExpenseId,

  // Ownership
  user_id: UserId, // Note: snake_case for DB

  // Core data
  amount: Amount,
  currency: Currency,
  description: Schema.String,
  date: Schema.Date,

  // Categorization
  category_id: CategoryId,
  tags: Schema.Array(Schema.String),

  // State
  status: Schema.Literal("pending", "approved", "rejected"),

  // Metadata (DB manages these)
  created_at: Schema.Date,
  updated_at: Schema.Date,

  // Optional
  notes: Schema.NullOr(Schema.String), // DB stores null, not Option
  receipt_url: Schema.NullOr(Schema.String),
})
type ExpenseRow = typeof ExpenseRow.Type

/**
 * SCHEMA 2: Create Input (what client sends to create)
 *
 * NO: id, timestamps (server generates)
 * NO: userId (from auth session)
 * YES: all user-provided data
 */
const CreateExpenseInput = Schema.Struct({
  // Core data (required)
  amount: Schema.Number.pipe(Schema.positive()), // Validate on input
  currency: Currency,
  description: Schema.String.pipe(Schema.minLength(1)),
  date: Schema.Date,

  // Categorization
  categoryId: CategoryId,
  tags: Schema.optional(Schema.Array(Schema.String)), // Optional array

  // Optional
  notes: Schema.optional(Schema.String),
  receiptUrl: Schema.optional(Schema.String),
})
type CreateExpenseInput = typeof CreateExpenseInput.Type

/**
 * SCHEMA 3: Update Input (what client sends to update)
 *
 * All fields optional (partial update)
 * Can't change: id, userId, createdAt
 */
const UpdateExpenseInput = Schema.Struct({
  amount: Schema.optional(Schema.Number.pipe(Schema.positive())),
  currency: Schema.optional(Currency),
  description: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  date: Schema.optional(Schema.Date),
  categoryId: Schema.optional(CategoryId),
  tags: Schema.optional(Schema.Array(Schema.String)),
  notes: Schema.optional(Schema.NullOr(Schema.String)), // Can set to null to clear
  receiptUrl: Schema.optional(Schema.NullOr(Schema.String)),
  status: Schema.optional(Schema.Literal("pending", "approved", "rejected")),
})
type UpdateExpenseInput = typeof UpdateExpenseInput.Type

/**
 * SCHEMA 4: Domain Model (what your app uses internally)
 *
 * Rich model with methods, computed properties, etc.
 * Uses camelCase, branded types, Option for nullables.
 */
class Expense extends Schema.Class<Expense>("Expense")({
  id: ExpenseId,
  userId: UserId,
  amount: Amount,
  currency: Currency,
  description: Schema.String,
  date: Schema.Date,
  categoryId: CategoryId,
  tags: Schema.Array(Schema.String),
  status: Schema.Literal("pending", "approved", "rejected"),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
  notes: Schema.optionalWith(Schema.String, { as: "Option" }),
  receiptUrl: Schema.optionalWith(Schema.String, { as: "Option" }),
}) {
  // Computed properties
  get formattedAmount(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`
  }

  get isPending(): boolean {
    return this.status === "pending"
  }

  get isApproved(): boolean {
    return this.status === "approved"
  }

  // Domain methods
  canBeEdited(): boolean {
    return this.status === "pending"
  }

  needsReceipt(): boolean {
    return this.amount > 1000 && Option.isNone(this.receiptUrl)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3c. Converting Between Schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DB Row → Domain Model
 */
const rowToExpense = (row: ExpenseRow): Expense =>
  Expense.make({
    id: row.id,
    userId: row.user_id,
    amount: Amount.make(row.amount), // Re-wrap with brand
    currency: row.currency,
    description: row.description,
    date: row.date,
    categoryId: row.category_id,
    tags: row.tags,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: row.notes ? Option.some(row.notes) : Option.none(),
    receiptUrl: row.receipt_url ? Option.some(row.receipt_url) : Option.none(),
  })

/**
 * Create Input + Context → Domain Model (for new records)
 */
const createInputToExpense = (
  input: CreateExpenseInput,
  userId: UserId
): Expense => {
  const now = new Date()
  return Expense.make({
    id: ExpenseId.make(crypto.randomUUID()),
    userId,
    amount: Amount.make(input.amount),
    currency: input.currency,
    description: input.description,
    date: input.date,
    categoryId: input.categoryId,
    tags: input.tags ?? [],
    status: "pending",
    createdAt: now,
    updatedAt: now,
    notes: input.notes ? Option.some(input.notes) : Option.none(),
    receiptUrl: input.receiptUrl ? Option.some(input.receiptUrl) : Option.none(),
  })
}

/**
 * Domain Model → DB Row (for saving)
 */
const expenseToRow = (expense: Expense): ExpenseRow => ({
  id: expense.id,
  user_id: expense.userId,
  amount: expense.amount,
  currency: expense.currency,
  description: expense.description,
  date: expense.date,
  category_id: expense.categoryId,
  tags: expense.tags,
  status: expense.status,
  created_at: expense.createdAt,
  updated_at: expense.updatedAt,
  notes: Option.getOrNull(expense.notes),
  receipt_url: Option.getOrNull(expense.receiptUrl),
})

// ─────────────────────────────────────────────────────────────────────────────
// 3d. Field Categories Cheat Sheet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       FIELD CATEGORIES CHEAT SHEET                         ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  IDENTITY FIELDS                                                          ║
 * ║  ───────────────                                                          ║
 * ║  id          Primary key, generated by server                             ║
 * ║                                                                           ║
 * ║  OWNERSHIP FIELDS                                                         ║
 * ║  ────────────────                                                         ║
 * ║  userId      Who owns/created this? (from auth, not from input)           ║
 * ║  tenantId    Multi-tenant apps: which organization?                       ║
 * ║  createdBy   Audit trail: who created?                                    ║
 * ║                                                                           ║
 * ║  TIMESTAMP FIELDS (auto-managed)                                          ║
 * ║  ────────────────────────────────                                         ║
 * ║  createdAt   When was record created? (set once, never change)            ║
 * ║  updatedAt   When was record last modified? (update on every save)        ║
 * ║  deletedAt   Soft delete timestamp (null if not deleted)                  ║
 * ║                                                                           ║
 * ║  STATE FIELDS                                                             ║
 * ║  ────────────                                                             ║
 * ║  status      Workflow state (pending, active, completed, etc.)            ║
 * ║  isActive    Simple boolean flag                                          ║
 * ║  version     Optimistic locking counter                                   ║
 * ║                                                                           ║
 * ║  RELATIONSHIP FIELDS                                                      ║
 * ║  ────────────────────                                                     ║
 * ║  categoryId  Foreign key to another entity                                ║
 * ║  parentId    Self-referential relationship                                ║
 * ║  tags        Many-to-many via array or junction table                     ║
 * ║                                                                           ║
 * ║  OPTIONAL FIELDS (use Option<T>)                                          ║
 * ║  ───────────────────────────────                                          ║
 * ║  notes       Additional info that might be empty                          ║
 * ║  imageUrl    Optional attachment                                          ║
 * ║  phoneNumber Secondary contact info                                       ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// SECTION 4: Schema.Class - Domain Models
// =============================================================================

/**
 * Schema.Class creates domain models with:
 * - Type-safe fields
 * - Auto-generated .make() constructor
 * - Custom methods and getters
 * - Serialization support
 */

class User extends Schema.Class<User>("User")({
  id: UserId,
  name: Schema.String,
  email: Email,
  createdAt: Schema.Date,
}) {
  get displayName(): string {
    return `${this.name} (${this.email})`
  }

  isOlderThan(days: number): boolean {
    const now = new Date()
    const diff = now.getTime() - this.createdAt.getTime()
    return diff > days * 24 * 60 * 60 * 1000
  }
}

const user = User.make({
  id: UserId.make("user-123"),
  name: "Alice",
  email: Email.make("alice@example.com"),
  createdAt: new Date(),
})

// =============================================================================
// SECTION 5: Schema.TaggedClass - Variants (OR Types)
// =============================================================================

/**
 * TaggedClass creates discriminated unions with a _tag field.
 * Use when something can be ONE OF several shapes.
 */

class Success extends Schema.TaggedClass<Success>()("Success", {
  value: Schema.Number,
}) {}

class Failure extends Schema.TaggedClass<Failure>()("Failure", {
  error: Schema.String,
}) {}

const Result = Schema.Union(Success, Failure)
type Result = typeof Result.Type

// Pattern matching with Match
const handleResult = (result: Result): string =>
  Match.valueTags(result, {
    Success: ({ value }) => `Got value: ${value}`,
    Failure: ({ error }) => `Error: ${error}`,
  })

// Real-world example: Payment states
class PaymentPending extends Schema.TaggedClass<PaymentPending>()(
  "PaymentPending",
  { orderId: Schema.String }
) {}

class PaymentCompleted extends Schema.TaggedClass<PaymentCompleted>()(
  "PaymentCompleted",
  {
    orderId: Schema.String,
    transactionId: Schema.String,
    paidAt: Schema.Date,
  }
) {}

class PaymentFailed extends Schema.TaggedClass<PaymentFailed>()(
  "PaymentFailed",
  {
    orderId: Schema.String,
    reason: Schema.String,
    failedAt: Schema.Date,
  }
) {}

const PaymentStatus = Schema.Union(
  PaymentPending,
  PaymentCompleted,
  PaymentFailed
)
type PaymentStatus = typeof PaymentStatus.Type

// =============================================================================
// SECTION 6: Decoding & Validation
// =============================================================================

/**
 * Schema.decodeUnknown - Validate unknown data (API input, etc.)
 * Returns Effect that succeeds with typed data or fails with ParseError.
 */

const parseUserExample = Effect.gen(function* () {
  const rawData: unknown = {
    id: "user-123",
    name: "Bob",
    email: "bob@example.com",
    createdAt: "2024-01-15T10:00:00Z",
  }

  // Decode and validate
  const parsedUser = yield* Schema.decodeUnknown(User)(rawData)
  return parsedUser
})

// Handling validation errors
const safeParseUser = (data: unknown) =>
  Schema.decodeUnknown(User)(data).pipe(
    Effect.catchTag("ParseError", (error) => {
      console.error("Validation failed:", error.message)
      return Effect.fail("Invalid user data" as const)
    })
  )

// =============================================================================
// SECTION 7: JSON Encoding/Decoding
// =============================================================================

/**
 * Schema.parseJson - Parse JSON string directly into typed object.
 */

const UserFromJson = Schema.parseJson(User)

const jsonRoundTrip = Effect.gen(function* () {
  const jsonString =
    '{"id":"user-123","name":"Alice","email":"alice@test.com","createdAt":"2024-01-15T10:00:00.000Z"}'

  // Parse JSON → User
  const parsedUser = yield* Schema.decodeUnknown(UserFromJson)(jsonString)

  // User → JSON
  const encoded = yield* Schema.encode(UserFromJson)(parsedUser)

  return encoded
})

// =============================================================================
// SECTION 8: Transformations & Refinements
// =============================================================================

// String constraints
const Username = Schema.String.pipe(
  Schema.minLength(3),
  Schema.maxLength(20),
  Schema.brand("Username")
)

// Number constraints
const Age = Schema.Int.pipe(Schema.between(0, 150), Schema.brand("Age"))

// Pattern matching
const EmailPattern = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("ValidEmail")
)

// Custom filter
const EvenNumber = Schema.Number.pipe(
  Schema.filter((n) => n % 2 === 0, { message: () => "Must be even" })
)

// Transform between types
const StringToNumber = Schema.transform(Schema.String, Schema.Number, {
  decode: (s) => parseInt(s, 10),
  encode: (n) => n.toString(),
})

// =============================================================================
// SECTION 9: Complete Example - Category Entity
// =============================================================================

/**
 * Let's model a Category entity following our guidelines.
 */

// Database schema
const CategoryRow = Schema.Struct({
  id: CategoryId,
  user_id: UserId,
  name: Schema.String,
  icon: Schema.String,
  color: Schema.String,
  is_default: Schema.Boolean,
  created_at: Schema.Date,
  updated_at: Schema.Date,
})

// Create input
const CreateCategoryInput = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(50)),
  icon: Schema.String,
  color: Schema.String.pipe(Schema.pattern(/^#[0-9A-Fa-f]{6}$/)), // Hex color
})
type CreateCategoryInput = typeof CreateCategoryInput.Type

// Domain model
class Category extends Schema.Class<Category>("Category")({
  id: CategoryId,
  userId: UserId,
  name: Schema.String,
  icon: Schema.String,
  color: Schema.String,
  isDefault: Schema.Boolean,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {
  get displayName(): string {
    return `${this.icon} ${this.name}`
  }
}

// =============================================================================
// SECTION 10: Anti-Patterns
// =============================================================================

/**
 * ❌ DON'T: Use raw primitives in domain models
 *
 * WRONG:
 *   interface BadExpense {
 *     id: string
 *     userId: string  // Easy to swap with expenseId!
 *   }
 *
 * RIGHT:
 *   class GoodExpense extends Schema.Class<...>({
 *     id: ExpenseId,
 *     userId: UserId,  // Type-safe!
 *   }) {}
 */

/**
 * ❌ DON'T: Import from @effect/schema (deprecated)
 *
 * WRONG: import { Schema } from "@effect/schema"
 * RIGHT: import { Schema } from "effect"
 */

/**
 * ❌ DON'T: Trust external data without validation
 *
 * WRONG: const user = externalData as User
 * RIGHT: const user = yield* Schema.decodeUnknown(User)(externalData)
 */

/**
 * ❌ DON'T: Include generated fields in create input
 *
 * WRONG:
 *   const CreateInput = Schema.Struct({
 *     id: ExpenseId,  // Server should generate this!
 *     createdAt: Schema.Date,  // Server should set this!
 *     ...
 *   })
 */

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Section 1: Primitives
  StringSchema,
  NumberSchema,
  StatusLiteral,

  // Section 2: Branded types
  userId,
  postId,
  email,
  port,
  amount,

  // Section 3: Data modeling
  ExpenseRow,
  CreateExpenseInput,
  UpdateExpenseInput,
  Expense,
  rowToExpense,
  createInputToExpense,
  expenseToRow,

  // Section 4: Classes
  User,
  user,

  // Section 5: Variants
  Result,
  handleResult,
  PaymentStatus,

  // Section 6: Decoding
  parseUserExample,
  safeParseUser,

  // Section 7: JSON
  jsonRoundTrip,

  // Section 8: Refinements
  Username,
  Age,
  EmailPattern,
  EvenNumber,

  // Section 9: Category
  Category,
  CreateCategoryInput,
}
