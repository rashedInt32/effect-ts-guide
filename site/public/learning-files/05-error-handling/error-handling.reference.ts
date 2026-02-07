/**
 * =============================================================================
 * ERROR HANDLING - REFERENCE
 * =============================================================================
 *
 * Effect provides type-safe error handling. Errors are part of the type system,
 * making it impossible to forget about error handling.
 *
 * TABLE OF CONTENTS:
 *   1. Error Handling Mental Model - Expected vs Defects
 *   2. Schema.TaggedError - Creating domain errors
 *   3. Failing with Errors - Effect.fail vs yield*
 *   4. Catching Errors - catchAll, catchTag, catchTags
 *   5. Error Transformation - mapError, orElse
 *   6. WHEN TO USE WHICH? Decision Guide (NEW!)
 *   7. Pattern Matching on Errors
 *   8. Error Unions and Organization
 *   9. Complete Example - Expense Creation
 *   10. Anti-Patterns
 *
 * DOCS: https://effect.website/docs/error-management
 *
 * =============================================================================
 */

import { Cause, Effect, Exit, Match, Schema } from "effect"

// =============================================================================
// SECTION 1: Error Handling Mental Model
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    TWO KINDS OF FAILURES IN EFFECT                         ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  1. EXPECTED ERRORS (E type parameter)                                    ║
 * ║     ─────────────────────────────────────                                 ║
 * ║     Domain failures that callers CAN and SHOULD handle.                   ║
 * ║     They're part of your API contract.                                    ║
 * ║                                                                           ║
 * ║     Examples:                                                             ║
 * ║       - UserNotFound                                                      ║
 * ║       - ValidationError                                                   ║
 * ║       - InsufficientFunds                                                 ║
 * ║       - RateLimitExceeded                                                 ║
 * ║                                                                           ║
 * ║     function findUser(id: UserId): Effect<User, UserNotFound>             ║
 * ║                                          ^^^^^ tracked in types!          ║
 * ║                                                                           ║
 * ║  2. DEFECTS (not in types - fiber terminates)                             ║
 * ║     ──────────────────────────────────────────                            ║
 * ║     Unrecoverable bugs and programmer errors.                             ║
 * ║     Should NOT happen in correct code.                                    ║
 * ║                                                                           ║
 * ║     Examples:                                                             ║
 * ║       - Null pointer access                                               ║
 * ║       - Division by zero                                                  ║
 * ║       - Index out of bounds                                               ║
 * ║       - Invariant violations                                              ║
 * ║                                                                           ║
 * ║     // This kills the fiber, no recovery                                  ║
 * ║     yield* Effect.die(new Error("This should never happen"))              ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * DECISION: Should this be an Expected Error or a Defect?
 *
 *   Can the caller reasonably HANDLE this? ──── YES ──→ Expected Error
 *                      │
 *                     NO
 *                      │
 *                      ▼
 *               Use Effect.die (Defect)
 */

// =============================================================================
// SECTION 2: Schema.TaggedError - Creating Domain Errors
// =============================================================================

/**
 * Schema.TaggedError creates errors that are:
 * - Serializable (can send over network)
 * - Type-safe (tracked in Effect's E parameter)
 * - Pattern-matchable (via _tag field)
 * - Yieldable (can use directly without Effect.fail)
 */

// ─────────────────────────────────────────────────────────────────────────────
// 2a. Simple error with fields
// ─────────────────────────────────────────────────────────────────────────────

class ValidationError extends Schema.TaggedError<ValidationError>()(
  "ValidationError",
  {
    field: Schema.String,
    message: Schema.String,
  }
) {}

// ─────────────────────────────────────────────────────────────────────────────
// 2b. Error with branded ID (common pattern)
// ─────────────────────────────────────────────────────────────────────────────

const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type

class UserNotFound extends Schema.TaggedError<UserNotFound>()("UserNotFound", {
  id: UserId,
}) {}

// ─────────────────────────────────────────────────────────────────────────────
// 2c. Error with multiple fields
// ─────────────────────────────────────────────────────────────────────────────

class InsufficientFunds extends Schema.TaggedError<InsufficientFunds>()(
  "InsufficientFunds",
  {
    requested: Schema.Number,
    available: Schema.Number,
    currency: Schema.String,
  }
) {}

// ─────────────────────────────────────────────────────────────────────────────
// 2d. Creating error instances
// ─────────────────────────────────────────────────────────────────────────────

// Use the constructor:
const validationErr = new ValidationError({
  field: "email",
  message: "Invalid email format",
})

// Or use .make():
const notFoundErr = UserNotFound.make({
  id: UserId.make("user-123"),
})

const insufficientErr = InsufficientFunds.make({
  requested: 500,
  available: 100,
  currency: "USD",
})

// =============================================================================
// SECTION 3: Failing with Errors
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║               TWO WAYS TO FAIL: Effect.fail vs yield*                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  METHOD 1: yield* (RECOMMENDED for TaggedError)                           ║
 * ║  ─────────────────────────────────────────────────                        ║
 * ║  TaggedErrors are "yieldable" - just yield* them directly!                ║
 * ║                                                                           ║
 * ║    if (!user) {                                                           ║
 * ║      return yield* new UserNotFound({ id })                               ║
 * ║    }                                                                      ║
 * ║                                                                           ║
 * ║  METHOD 2: Effect.fail (for non-TaggedError or explicit style)            ║
 * ║  ──────────────────────────────────────────────────────────────           ║
 * ║    return Effect.fail("something went wrong")                             ║
 * ║    return Effect.fail(new Error("oops"))                                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Simulated data
const usersDb = new Map([
  [UserId.make("user-1"), { id: UserId.make("user-1"), name: "Alice", email: "alice@example.com" }],
  [UserId.make("user-2"), { id: UserId.make("user-2"), name: "Bob", email: "bob@example.com" }],
])

// ─────────────────────────────────────────────────────────────────────────────
// 3a. Using yield* with TaggedError (RECOMMENDED)
// ─────────────────────────────────────────────────────────────────────────────

const findUser = Effect.fn("findUser")(function* (id: UserId) {
  const user = usersDb.get(id)
  if (!user) {
    // Direct yield - no Effect.fail() needed!
    return yield* new UserNotFound({ id })
  }
  return user
})
// Type: Effect<{ id: UserId; name: string; email: string }, UserNotFound, never>

// ─────────────────────────────────────────────────────────────────────────────
// 3b. Using Effect.fail (for simple errors or non-TaggedError)
// ─────────────────────────────────────────────────────────────────────────────

const failWithString = Effect.fail("Something went wrong")
// Type: Effect<never, string, never>

const failWithError = Effect.fail(new Error("Oops"))
// Type: Effect<never, Error, never>

// ─────────────────────────────────────────────────────────────────────────────
// 3c. Using Effect.die (for defects - unrecoverable)
// ─────────────────────────────────────────────────────────────────────────────

const assertNonNull = <T>(value: T | null, message: string): Effect.Effect<T> =>
  value !== null
    ? Effect.succeed(value)
    : Effect.die(new Error(message)) // Defect - terminates fiber
// Type: Effect<T, never, never> - no error type! It's a defect

// =============================================================================
// SECTION 4: Catching Errors
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                        ERROR CATCHING OPTIONS                              ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  catchAll(fn)       Catch ALL errors, transform to success                ║
 * ║  catchTag(tag, fn)  Catch ONE specific error type                         ║
 * ║  catchTags({...})   Catch MULTIPLE specific error types                   ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 4a. Effect.catchAll - Catch ALL errors
// ─────────────────────────────────────────────────────────────────────────────

const catchAllExample = findUser(UserId.make("non-existent")).pipe(
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      yield* Effect.logWarning(`User not found: ${error.id}`)
      return { id: error.id, name: "Guest", email: "guest@example.com" } // Fallback
    })
  )
)
// Type: Effect<{ id: UserId; name: string; email: string }, never, never>
//                                                          ^^^^^ Error handled!

// ─────────────────────────────────────────────────────────────────────────────
// 4b. Effect.catchTag - Catch ONE specific error type
// ─────────────────────────────────────────────────────────────────────────────

// Define a union of possible errors
const ExpenseId = Schema.String.pipe(Schema.brand("ExpenseId"))
type ExpenseId = typeof ExpenseId.Type

class ExpenseNotFound extends Schema.TaggedError<ExpenseNotFound>()(
  "ExpenseNotFound",
  { id: ExpenseId }
) {}

type AppError = UserNotFound | ValidationError | ExpenseNotFound

// Function that can fail with multiple errors
const processOrder = (userId: UserId): Effect.Effect<string, AppError> =>
  Effect.gen(function* () {
    const user = yield* findUser(userId) // Can fail with UserNotFound
    return `Order processed for ${user.name}`
  })

// Handle ONLY UserNotFound, let others propagate
const handleUserNotFound = processOrder(UserId.make("unknown")).pipe(
  Effect.catchTag("UserNotFound", (error) =>
    Effect.succeed(`Guest order processed (user ${error.id} not found)`)
  )
)
// Type: Effect<string, ValidationError | ExpenseNotFound, never>
//                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                      UserNotFound is handled, others remain!

// ─────────────────────────────────────────────────────────────────────────────
// 4c. Effect.catchTags - Catch MULTIPLE specific error types
// ─────────────────────────────────────────────────────────────────────────────

const handleMultiple = processOrder(UserId.make("unknown")).pipe(
  Effect.catchTags({
    UserNotFound: (e) => Effect.succeed(`Guest: ${e.id}`),
    ValidationError: (e) => Effect.succeed(`Validation failed: ${e.message}`),
  })
)
// Type: Effect<string, ExpenseNotFound, never>
//                      ^^^^^^^^^^^^^^^ Only this error remains

// =============================================================================
// SECTION 5: Error Transformation
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      ERROR TRANSFORMATION OPTIONS                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  mapError(fn)         Transform error to different type                   ║
 * ║  orElseFail(fn)       Replace error with a different error                ║
 * ║  orElseSucceed(fn)    Replace error with a success value                  ║
 * ║  orElse(fn)           Replace with entirely different Effect              ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// API error for HTTP responses
class ApiError extends Schema.TaggedError<ApiError>()("ApiError", {
  statusCode: Schema.Number,
  message: Schema.String,
}) {}

// ─────────────────────────────────────────────────────────────────────────────
// 5a. Effect.mapError - Transform error type
// ─────────────────────────────────────────────────────────────────────────────

// Convert domain error to API error
const mapToApiError = findUser(UserId.make("unknown")).pipe(
  Effect.mapError(
    (error) =>
      new ApiError({
        statusCode: 404,
        message: `User ${error.id} not found`,
      })
  )
)
// Type: Effect<User, ApiError, never>
//                    ^^^^^^^^ Error type changed

// ─────────────────────────────────────────────────────────────────────────────
// 5b. Effect.orElseFail - Replace error entirely
// ─────────────────────────────────────────────────────────────────────────────

const replaceError = findUser(UserId.make("unknown")).pipe(
  Effect.orElseFail(() => new ApiError({ statusCode: 500, message: "Internal error" }))
)

// ─────────────────────────────────────────────────────────────────────────────
// 5c. Effect.orElseSucceed - Provide fallback value
// ─────────────────────────────────────────────────────────────────────────────

const withFallback = findUser(UserId.make("unknown")).pipe(
  Effect.orElseSucceed(() => ({
    id: UserId.make("guest"),
    name: "Guest",
    email: "guest@example.com",
  }))
)
// Type: Effect<User, never, never>
//                    ^^^^^ No error - always succeeds with fallback

// =============================================================================
// SECTION 6: WHEN TO USE WHICH? Decision Guide
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     ERROR HANDLING DECISION GUIDE                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  SCENARIO                              WHAT TO USE                        ║
 * ║  ────────────────────────────────────  ─────────────────────────────────  ║
 * ║                                                                           ║
 * ║  Handle ALL errors with fallback       catchAll                           ║
 * ║  Handle ONE specific error             catchTag("ErrorName", fn)          ║
 * ║  Handle MULTIPLE specific errors       catchTags({ E1: fn, E2: fn })      ║
 * ║  Convert domain error → API error      mapError                           ║
 * ║  Provide default value on any error    orElseSucceed                      ║
 * ║  Replace error with different error    orElseFail                         ║
 * ║  Let error propagate to caller         (do nothing - it propagates!)      ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * COMMON PATTERNS:
 *
 * 1. API BOUNDARY - Convert domain errors to HTTP errors:
 *
 *    myEffect.pipe(
 *      Effect.catchTags({
 *        UserNotFound: (e) => Effect.fail(new ApiError({ statusCode: 404, ... })),
 *        ValidationError: (e) => Effect.fail(new ApiError({ statusCode: 400, ... })),
 *      })
 *    )
 *
 * 2. REPOSITORY LAYER - Let NotFound propagate, handle others:
 *
 *    findUser(id)  // Returns Effect<User, UserNotFound>
 *    // Don't catch! Let caller decide what to do with UserNotFound
 *
 * 3. SERVICE LAYER - Combine multiple failures:
 *
 *    Effect.gen(function* () {
 *      const user = yield* findUser(id)        // UserNotFound
 *      const order = yield* findOrder(orderId) // OrderNotFound
 *      // Both errors automatically in the return type!
 *    })
 *
 * 4. OPTIONAL RESOURCE - Use orElseSucceed for optional:
 *
 *    findUser(id).pipe(
 *      Effect.orElseSucceed(() => null)  // Returns Effect<User | null, never>
 *    )
 */

// ─────────────────────────────────────────────────────────────────────────────
// 6a. Example: API boundary pattern
// ─────────────────────────────────────────────────────────────────────────────

const createUserHandler = (name: string, email: string) =>
  Effect.gen(function* () {
    // Validate
    if (!email.includes("@")) {
      return yield* new ValidationError({ field: "email", message: "Invalid format" })
    }

    // Check if exists
    const existing = yield* findUser(UserId.make(email)).pipe(
      Effect.orElseSucceed(() => null)
    )

    if (existing) {
      return yield* new ValidationError({ field: "email", message: "Already exists" })
    }

    // Create user
    const user = {
      id: UserId.make(crypto.randomUUID()),
      name,
      email,
    }

    return user
  }).pipe(
    // Convert domain errors to API errors at the boundary
    Effect.mapError(
      (error) =>
        new ApiError({
          statusCode: 400,
          message: `${error.field}: ${error.message}`,
        })
    )
  )

// ─────────────────────────────────────────────────────────────────────────────
// 6b. Example: Optional resource pattern
// ─────────────────────────────────────────────────────────────────────────────

// When absence is a valid state (not an error)
const findUserOrNull = (id: UserId) =>
  findUser(id).pipe(Effect.orElseSucceed(() => null))
// Type: Effect<User | null, never, never>

// When you want to distinguish "not found" from "found"
const findUserOption = (id: UserId) =>
  findUser(id).pipe(Effect.option)
// Type: Effect<Option<User>, never, never>

// =============================================================================
// SECTION 7: Pattern Matching on Errors
// =============================================================================

/**
 * Use Match.valueTags for exhaustive error handling.
 * TypeScript ensures you handle ALL cases!
 */

type AllErrors = UserNotFound | ValidationError | ExpenseNotFound | InsufficientFunds

const handleAllErrors = (error: AllErrors): string =>
  Match.valueTags(error, {
    UserNotFound: (e) => `User ${e.id} was not found`,
    ValidationError: (e) => `Validation failed on ${e.field}: ${e.message}`,
    ExpenseNotFound: (e) => `Expense ${e.id} was not found`,
    InsufficientFunds: (e) =>
      `Need ${e.requested} ${e.currency}, only have ${e.available}`,
  })

// Using in an Effect:
const handleWithMatch = processOrder(UserId.make("test")).pipe(
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      const message = handleAllErrors(error as AllErrors)
      yield* Effect.logWarning(message)
      return message
    })
  )
)

// =============================================================================
// SECTION 8: Error Unions and Organization
// =============================================================================

/**
 * Organize related errors into unions for cleaner APIs.
 */

// User-related errors
const UserErrors = Schema.Union(UserNotFound, ValidationError)
type UserErrors = typeof UserErrors.Type

// Payment-related errors
class PaymentDeclined extends Schema.TaggedError<PaymentDeclined>()(
  "PaymentDeclined",
  { reason: Schema.String }
) {}

class PaymentTimeout extends Schema.TaggedError<PaymentTimeout>()(
  "PaymentTimeout",
  { timeoutMs: Schema.Number }
) {}

const PaymentErrors = Schema.Union(InsufficientFunds, PaymentDeclined, PaymentTimeout)
type PaymentErrors = typeof PaymentErrors.Type

// =============================================================================
// SECTION 9: Complete Example - Expense Creation
// =============================================================================

/**
 * Real-world example with full error handling flow.
 */

// All errors for expense creation
class CategoryNotFound extends Schema.TaggedError<CategoryNotFound>()(
  "CategoryNotFound",
  { id: Schema.String }
) {}

class InvalidAmount extends Schema.TaggedError<InvalidAmount>()(
  "InvalidAmount",
  { amount: Schema.Number, reason: Schema.String }
) {}

type CreateExpenseError = UserNotFound | CategoryNotFound | InvalidAmount

// Validation helpers
const validateUser = (userId: UserId) =>
  Effect.gen(function* () {
    if (userId === UserId.make("invalid")) {
      return yield* new UserNotFound({ id: userId })
    }
    return { id: userId, name: "User" }
  })

const validateCategory = (categoryId: string) =>
  Effect.gen(function* () {
    if (categoryId === "invalid") {
      return yield* new CategoryNotFound({ id: categoryId })
    }
    return { id: categoryId, name: "Category" }
  })

const validateAmount = (amount: number) =>
  Effect.gen(function* () {
    if (amount <= 0) {
      return yield* new InvalidAmount({ amount, reason: "Must be positive" })
    }
    if (amount > 10000) {
      return yield* new InvalidAmount({ amount, reason: "Exceeds maximum" })
    }
    return amount
  })

// Main function - errors automatically tracked in type!
const createExpense = Effect.fn("createExpense")(function* (input: {
  userId: UserId
  categoryId: string
  amount: number
  description: string
}) {
  const user = yield* validateUser(input.userId)
  yield* Effect.logDebug(`Validated user: ${user.name}`)

  const category = yield* validateCategory(input.categoryId)
  yield* Effect.logDebug(`Validated category: ${category.name}`)

  const amount = yield* validateAmount(input.amount)
  yield* Effect.logDebug(`Validated amount: ${amount}`)

  const expense = {
    id: crypto.randomUUID(),
    userId: input.userId,
    categoryId: input.categoryId,
    amount,
    description: input.description,
  }

  yield* Effect.logInfo(`Created expense: ${expense.id}`)
  return expense
})
// Type: Effect<Expense, CreateExpenseError, never>
//                       ^^^^^^^^^^^^^^^^^^ All errors tracked!

// Convert to API errors at the boundary
const createExpenseHandler = (input: {
  userId: UserId
  categoryId: string
  amount: number
  description: string
}) =>
  createExpense(input).pipe(
    Effect.catchTags({
      UserNotFound: (e) =>
        Effect.fail(new ApiError({ statusCode: 404, message: `User ${e.id} not found` })),
      CategoryNotFound: (e) =>
        Effect.fail(new ApiError({ statusCode: 400, message: `Category ${e.id} not found` })),
      InvalidAmount: (e) =>
        Effect.fail(new ApiError({ statusCode: 400, message: `Invalid amount: ${e.reason}` })),
    })
  )
// Type: Effect<Expense, ApiError, never>
//                       ^^^^^^^^ Clean API error type

// =============================================================================
// SECTION 10: Anti-Patterns
// =============================================================================

/**
 * ❌ DON'T: Use Effect.fail with TaggedErrors
 *
 * WRONG:
 *   return Effect.fail(new UserNotFound({ id }))  // Redundant!
 *
 * CORRECT:
 *   return yield* new UserNotFound({ id })  // Direct yield
 */

/**
 * ❌ DON'T: Catch errors too early (swallowing them)
 *
 * WRONG - Hides errors from callers:
 *   const getUser = (id: UserId) =>
 *     findUser(id).pipe(Effect.catchAll(() => Effect.succeed(null)))
 *
 * CORRECT - Let errors propagate, handle at boundaries:
 *   const getUser = (id: UserId) => findUser(id)
 */

/**
 * ❌ DON'T: Use string errors for domain logic
 *
 * WRONG:
 *   Effect.fail("User not found")  // Unstructured, hard to handle
 *
 * CORRECT:
 *   return yield* new UserNotFound({ id })  // Structured, pattern-matchable
 */

/**
 * ❌ DON'T: Mix expected errors with defects
 *
 * WRONG - Using die for expected domain failures:
 *   if (!user) return yield* Effect.die(new Error("User not found"))
 *
 * CORRECT - Expected failures should be in E type:
 *   if (!user) return yield* new UserNotFound({ id })
 */

/**
 * ❌ DON'T: Forget to handle errors at boundaries
 *
 * WRONG - Returning Effect<T, DomainErrors> from API handler:
 *   return createExpense(input)  // DomainErrors leak to API!
 *
 * CORRECT - Convert to API errors at the boundary:
 *   return createExpense(input).pipe(Effect.catchTags({ ... }))
 */

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Section 2: Error definitions
  ValidationError,
  UserNotFound,
  InsufficientFunds,
  ExpenseNotFound,
  validationErr,
  notFoundErr,
  insufficientErr,

  // Section 3: Using errors
  findUser,
  assertNonNull,

  // Section 4: Catching errors
  catchAllExample,
  handleUserNotFound,
  handleMultiple,

  // Section 5: Transformation
  ApiError,
  mapToApiError,
  withFallback,

  // Section 6: Decision guide examples
  createUserHandler,
  findUserOrNull,
  findUserOption,

  // Section 7: Pattern matching
  handleAllErrors,
  handleWithMatch,

  // Section 8: Error unions
  UserErrors,
  PaymentErrors,

  // Section 9: Complete example
  createExpense,
  createExpenseHandler,
}
