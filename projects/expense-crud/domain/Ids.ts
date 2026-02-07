/**
 * =============================================================================
 * BRANDED IDS - PRACTICE
 * =============================================================================
 *
 * Branded types make IDs type-safe. You can't accidentally pass a
 * CategoryId where an ExpenseId is expected.
 *
 * TASK: Implement ExpenseId and CategoryId as branded types.
 *
 * REFERENCE: See learning/02-schema/schema.reference.ts for examples
 *
 * =============================================================================
 */

import { Schema } from "effect"

// =============================================================================
// EXERCISE: Create Branded IDs
// =============================================================================

/**
 * TODO: Create ExpenseId as a branded string
 *
 * It should:
 * - Be a string under the hood
 * - Have brand "ExpenseId" so it can't be mixed with other IDs
 * - Have a Schema for encoding/decoding
 *
 * HINT:
 *   export const ExpenseId = Schema.String.pipe(Schema.brand("ExpenseId"))
 *   export type ExpenseId = typeof ExpenseId.Type
 */

// Uncomment and implement:
// export const ExpenseId = ???
// export type ExpenseId = ???

/**
 * TODO: Create CategoryId as a branded string
 */

// Uncomment and implement:
// export const CategoryId = ???
// export type CategoryId = ???

/**
 * TODO: Create helper functions to generate IDs
 *
 * HINT: Use crypto.randomUUID() or a simple incrementing counter
 */

// Uncomment and implement:
// export const generateExpenseId = (): ExpenseId => ???
// export const generateCategoryId = (): CategoryId => ???

// =============================================================================
// SOLUTION (Don't peek until you've tried!)
// =============================================================================

// Scroll down...
//
//
//
//
//
//
//
//
//
//
//

export const ExpenseId = Schema.String.pipe(Schema.brand("ExpenseId"))
export type ExpenseId = typeof ExpenseId.Type

export const CategoryId = Schema.String.pipe(Schema.brand("CategoryId"))
export type CategoryId = typeof CategoryId.Type

// Helper to generate IDs
export const generateExpenseId = (): ExpenseId =>
  `exp-${crypto.randomUUID()}` as ExpenseId

export const generateCategoryId = (): CategoryId =>
  `cat-${crypto.randomUUID()}` as CategoryId

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

// This is type-safe - you CAN'T do this:
// const badId: ExpenseId = "some-string"  // ❌ Error!
// const mixedUp: ExpenseId = generateCategoryId()  // ❌ Error!

// You CAN do this:
const validExpenseId: ExpenseId = generateExpenseId() // ✅
const validCategoryId: CategoryId = generateCategoryId() // ✅

// Export for testing
export { validExpenseId, validCategoryId }
