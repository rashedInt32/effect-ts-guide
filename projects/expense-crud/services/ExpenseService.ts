/**
 * =============================================================================
 * EXPENSE SERVICE - PRACTICE
 * =============================================================================
 *
 * The Service layer contains BUSINESS LOGIC:
 * - Validation
 * - Enrichment (adding category to expense)
 * - Authorization (not in this example)
 * - Orchestration of multiple operations
 *
 * TASK:
 * 1. Define the ExpenseService interface
 * 2. Implement it using the repository
 *
 * =============================================================================
 */

import { Context, Effect, Layer } from "effect"
import { ExpenseId, CategoryId, generateExpenseId } from "../domain/Ids.js"
import { Category, sampleCategories } from "../domain/Category.js"
import { CreateExpenseInput, Expense, ExpenseRow, enrichExpense } from "../domain/Expense.js"
import { ExpenseNotFound, CategoryNotFound, InvalidExpenseData } from "../errors/index.js"
import { ExpenseRepository } from "../repositories/ExpenseRepository.js"

// =============================================================================
// EXERCISE 1: Define the Service Interface
// =============================================================================

/**
 * Service interface - works with domain models (Expense), not rows!
 */
export interface ExpenseService {
  readonly createExpense: (
    input: CreateExpenseInput
  ) => Effect.Effect<Expense, CategoryNotFound | InvalidExpenseData>

  readonly getExpense: (id: ExpenseId) => Effect.Effect<Expense, ExpenseNotFound | CategoryNotFound>

  readonly listExpenses: () => Effect.Effect<Expense[], CategoryNotFound>

  readonly listByCategory: (categoryId: CategoryId) => Effect.Effect<Expense[], CategoryNotFound>

  readonly deleteExpense: (id: ExpenseId) => Effect.Effect<void, ExpenseNotFound>
}

export const ExpenseService = Context.GenericTag<ExpenseService>("ExpenseService")

// =============================================================================
// EXERCISE 2: Implement the Service
// =============================================================================

/**
 * TODO: Implement the service with business logic
 *
 * HINTS:
 * - Inject ExpenseRepository using Effect.serviceFn or in makeExpenseService
 * - Validate input (amount > 0, description not empty)
 * - Enrich ExpenseRow with Category to create Expense
 * - Handle errors appropriately
 */

// Helper: Find category by ID (simulated - in real app, use CategoryRepository)
const findCategory = (id: CategoryId): Effect.Effect<Category, CategoryNotFound> => {
  const category = sampleCategories.find((c) => c.id === id)
  if (!category) {
    return Effect.fail(new CategoryNotFound({ id }))
  }
  return Effect.succeed(category)
}

// Helper: Find category by expense's categoryId
const getCategoryForExpense = (row: ExpenseRow) => findCategory(row.categoryId)

// Uncomment and implement:
// const makeExpenseService = Effect.gen(function* () {
//   const repo = yield* ExpenseRepository
//
//   // Helper to validate input
//   const validateInput = (input: CreateExpenseInput) =>
//     Effect.gen(function* () {
//       if (input.amount <= 0) {
//         return yield* Effect.fail(new InvalidExpenseData({
//           field: "amount",
//           reason: "Amount must be positive"
//         }))
//       }
//       if (!input.description.trim()) {
//         return yield* Effect.fail(new InvalidExpenseData({
//           field: "description",
//           reason: "Description cannot be empty"
//         }))
//       }
//       return input
//     })
//
//   return ExpenseService.of({
//     createExpense: (input) => ???,
//     getExpense: (id) => ???,
//     listExpenses: () => ???,
//     listByCategory: (categoryId) => ???,
//     deleteExpense: (id) => ???,
//   })
// })

// =============================================================================
// SOLUTION
// =============================================================================

const makeExpenseService = Effect.gen(function* () {
  const repo = yield* ExpenseRepository

  // Validate input data
  const validateInput = (input: CreateExpenseInput) =>
    Effect.gen(function* () {
      if (input.amount <= 0) {
        return yield* Effect.fail(
          new InvalidExpenseData({
            field: "amount",
            reason: "Amount must be positive",
          })
        )
      }
      if (!input.description.trim()) {
        return yield* Effect.fail(
          new InvalidExpenseData({
            field: "description",
            reason: "Description cannot be empty",
          })
        )
      }
      return input
    })

  // Enrich a row with its category
  const enrichRow = (row: ExpenseRow) =>
    getCategoryForExpense(row).pipe(Effect.map((category) => enrichExpense(row, category)))

  return ExpenseService.of({
    createExpense: (input) =>
      Effect.gen(function* () {
        // 1. Validate input
        const validInput = yield* validateInput(input)

        // 2. Verify category exists
        const category = yield* findCategory(validInput.categoryId)

        // 3. Create the row
        const now = new Date()
        const row = new ExpenseRow({
          id: generateExpenseId(),
          categoryId: validInput.categoryId,
          amount: validInput.amount,
          description: validInput.description,
          date: validInput.date,
          createdAt: now,
          updatedAt: now,
        })

        // 4. Save to repository
        yield* repo.create(row)

        // 5. Return enriched expense
        return enrichExpense(row, category)
      }),

    getExpense: (id) =>
      Effect.gen(function* () {
        const row = yield* repo.findById(id)
        return yield* enrichRow(row)
      }),

    listExpenses: () =>
      Effect.gen(function* () {
        const rows = yield* repo.findAll()
        // Enrich all rows (could be optimized to batch category lookups)
        return yield* Effect.all(rows.map(enrichRow))
      }),

    listByCategory: (categoryId) =>
      Effect.gen(function* () {
        // Verify category exists
        yield* findCategory(categoryId)

        const rows = yield* repo.findByCategory(categoryId)
        return yield* Effect.all(rows.map(enrichRow))
      }),

    deleteExpense: (id) => repo.delete(id),
  })
})

// =============================================================================
// LAYER
// =============================================================================

/**
 * Layer that provides ExpenseService
 * Requires: ExpenseRepository
 */
export const ExpenseServiceLayer = Layer.effect(ExpenseService, makeExpenseService)
