/**
 * =============================================================================
 * EXPENSE REPOSITORY - PRACTICE
 * =============================================================================
 *
 * The Repository pattern handles data persistence.
 * It should ONLY do CRUD - no business logic!
 *
 * TASK:
 * 1. Define the ExpenseRepository interface
 * 2. Implement an in-memory version for testing
 *
 * =============================================================================
 */

import { Context, Effect, Layer, Ref } from "effect"
import { ExpenseId, CategoryId } from "../domain/Ids.js"
import { ExpenseRow } from "../domain/Expense.js"
import { ExpenseNotFound } from "../errors/index.js"

// =============================================================================
// EXERCISE 1: Define the Repository Interface
// =============================================================================

/**
 * TODO: Define what methods the repository should have
 *
 * Methods:
 * - create(row: ExpenseRow): Effect<ExpenseRow>
 * - findById(id: ExpenseId): Effect<ExpenseRow, ExpenseNotFound>
 * - findAll(): Effect<ExpenseRow[]>
 * - findByCategory(categoryId: CategoryId): Effect<ExpenseRow[]>
 * - update(row: ExpenseRow): Effect<ExpenseRow, ExpenseNotFound>
 * - delete(id: ExpenseId): Effect<void, ExpenseNotFound>
 */

// The interface (already complete - study this pattern!)
export interface ExpenseRepository {
  readonly create: (row: ExpenseRow) => Effect.Effect<ExpenseRow>
  readonly findById: (id: ExpenseId) => Effect.Effect<ExpenseRow, ExpenseNotFound>
  readonly findAll: () => Effect.Effect<ExpenseRow[]>
  readonly findByCategory: (categoryId: CategoryId) => Effect.Effect<ExpenseRow[]>
  readonly update: (row: ExpenseRow) => Effect.Effect<ExpenseRow, ExpenseNotFound>
  readonly delete: (id: ExpenseId) => Effect.Effect<void, ExpenseNotFound>
}

// Create the Context.Tag for dependency injection
export const ExpenseRepository = Context.GenericTag<ExpenseRepository>("ExpenseRepository")

// =============================================================================
// EXERCISE 2: Implement In-Memory Repository
// =============================================================================

/**
 * TODO: Implement the ExpenseRepository interface using a Map for storage
 *
 * HINTS:
 * - Use Ref<Map<ExpenseId, ExpenseRow>> for mutable state
 * - Use Ref.get, Ref.update, Ref.modify
 * - Return ExpenseNotFound when item doesn't exist
 */

// Uncomment and implement:
// const makeInMemoryExpenseRepository = Effect.gen(function* () {
//   // Create a Ref holding a Map
//   const store = yield* Ref.make(new Map<ExpenseId, ExpenseRow>())
//
//   return ExpenseRepository.of({
//     create: (row) => ???,
//     findById: (id) => ???,
//     findAll: () => ???,
//     findByCategory: (categoryId) => ???,
//     update: (row) => ???,
//     delete: (id) => ???,
//   })
// })

// =============================================================================
// SOLUTION
// =============================================================================

const makeInMemoryExpenseRepository = Effect.gen(function* () {
  const store = yield* Ref.make(new Map<ExpenseId, ExpenseRow>())

  return ExpenseRepository.of({
    create: (row) =>
      Ref.update(store, (map) => new Map(map).set(row.id, row)).pipe(
        Effect.as(row)
      ),

    findById: (id) =>
      Ref.get(store).pipe(
        Effect.flatMap((map) => {
          const row = map.get(id)
          if (!row) {
            return Effect.fail(new ExpenseNotFound({ id }))
          }
          return Effect.succeed(row)
        })
      ),

    findAll: () =>
      Ref.get(store).pipe(Effect.map((map) => Array.from(map.values()))),

    findByCategory: (categoryId) =>
      Ref.get(store).pipe(
        Effect.map((map) =>
          Array.from(map.values()).filter((row) => row.categoryId === categoryId)
        )
      ),

    update: (row) =>
      Ref.get(store).pipe(
        Effect.flatMap((map) => {
          if (!map.has(row.id)) {
            return Effect.fail(new ExpenseNotFound({ id: row.id }))
          }
          return Ref.update(store, (m) => new Map(m).set(row.id, row)).pipe(
            Effect.as(row)
          )
        })
      ),

    delete: (id) =>
      Ref.get(store).pipe(
        Effect.flatMap((map) => {
          if (!map.has(id)) {
            return Effect.fail(new ExpenseNotFound({ id }))
          }
          return Ref.update(store, (m) => {
            const newMap = new Map(m)
            newMap.delete(id)
            return newMap
          })
        })
      ),
  })
})

// =============================================================================
// LAYER
// =============================================================================

/**
 * Layer that provides an in-memory ExpenseRepository
 * This is useful for testing!
 */
export const InMemoryExpenseRepositoryLayer = Layer.effect(
  ExpenseRepository,
  makeInMemoryExpenseRepository
)
