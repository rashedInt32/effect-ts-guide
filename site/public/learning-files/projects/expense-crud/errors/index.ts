/**
 * =============================================================================
 * DOMAIN ERRORS - PRACTICE
 * =============================================================================
 *
 * Tagged errors let you handle specific error types with catchTag.
 *
 * TASK: Implement domain-specific errors using Schema.TaggedError
 *
 * =============================================================================
 */

import { Schema } from "effect"
import { ExpenseId, CategoryId } from "../domain/Ids.js"

// =============================================================================
// EXERCISE: Create Tagged Errors
// =============================================================================

/**
 * TODO: Create ExpenseNotFound error
 *
 * Should include:
 * - _tag: "ExpenseNotFound" (automatic from TaggedError)
 * - id: ExpenseId (the ID that wasn't found)
 * - message: string (human-readable message)
 *
 * HINT:
 *   export class ExpenseNotFound extends Schema.TaggedError<ExpenseNotFound>()(
 *     "ExpenseNotFound",
 *     { id: ExpenseId, message: Schema.String }
 *   ) {}
 */

// Uncomment and implement:
// export class ExpenseNotFound extends Schema.TaggedError<ExpenseNotFound>()(
//   ???
// ) {}

/**
 * TODO: Create CategoryNotFound error
 */

// Uncomment and implement:
// export class CategoryNotFound extends Schema.TaggedError<CategoryNotFound>()(
//   ???
// ) {}

/**
 * TODO: Create InvalidExpenseData error
 *
 * For validation failures (negative amount, empty description, etc.)
 */

// Uncomment and implement:
// export class InvalidExpenseData extends Schema.TaggedError<InvalidExpenseData>()(
//   ???
// ) {}

// =============================================================================
// SOLUTION
// =============================================================================

export class ExpenseNotFound extends Schema.TaggedError<ExpenseNotFound>()(
  "ExpenseNotFound",
  {
    id: ExpenseId,
    message: Schema.optionalWith(Schema.String, {
      default: () => "Expense not found",
    }),
  }
) {}

export class CategoryNotFound extends Schema.TaggedError<CategoryNotFound>()(
  "CategoryNotFound",
  {
    id: CategoryId,
    message: Schema.optionalWith(Schema.String, {
      default: () => "Category not found",
    }),
  }
) {}

export class InvalidExpenseData extends Schema.TaggedError<InvalidExpenseData>()(
  "InvalidExpenseData",
  {
    field: Schema.String,
    reason: Schema.String,
    message: Schema.optionalWith(Schema.String, {
      default: () => "Invalid expense data",
    }),
  }
) {}

// =============================================================================
// UNION TYPE FOR ALL DOMAIN ERRORS
// =============================================================================

export type DomainError = ExpenseNotFound | CategoryNotFound | InvalidExpenseData
