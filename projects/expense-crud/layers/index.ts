/**
 * =============================================================================
 * LAYERS - PRACTICE
 * =============================================================================
 *
 * Layers wire everything together. This is where you compose your
 * dependency graph.
 *
 * TASK: Create the full application layer by composing all pieces
 *
 * =============================================================================
 */

import { Layer } from "effect"
import { ExpenseRepository, InMemoryExpenseRepositoryLayer } from "../repositories/ExpenseRepository.js"
import { ExpenseService, ExpenseServiceLayer } from "../services/ExpenseService.js"

// =============================================================================
// EXERCISE: Compose Layers
// =============================================================================

/**
 * TODO: Create the full application layer
 *
 * The dependency graph is:
 *   ExpenseService depends on ExpenseRepository
 *
 * We need to:
 * 1. Provide ExpenseRepository implementation
 * 2. Build ExpenseService on top
 *
 * HINT: Use Layer.provide to compose
 *   Layer.provide(ExpenseServiceLayer, InMemoryExpenseRepositoryLayer)
 */

// Uncomment and implement:
// export const AppLayer = ???

// =============================================================================
// SOLUTION
// =============================================================================

/**
 * The complete application layer for testing/development
 *
 * Layer composition works like this:
 * - ExpenseServiceLayer REQUIRES ExpenseRepository
 * - We PROVIDE InMemoryExpenseRepositoryLayer to satisfy that requirement
 *
 * The result is a layer that provides ExpenseService with no requirements
 */
export const AppLayer = ExpenseServiceLayer.pipe(Layer.provide(InMemoryExpenseRepositoryLayer))

// Type: Layer<ExpenseService, never, never>
//                ^^^^^^^^^^^^^^
//                Provides ExpenseService
//                             ^^^^^
//                             No errors
//                                   ^^^^^
//                                   No requirements!

/**
 * For a real application, you might have multiple layer configurations:
 */

// Development layer (in-memory, with logging)
export const DevLayer = AppLayer

// Test layer (in-memory, maybe with test doubles)
export const TestLayer = AppLayer

// Production layer would use real database:
// export const ProdLayer = ExpenseServiceLayer.pipe(
//   Layer.provide(PostgresExpenseRepositoryLayer)
// )

// =============================================================================
// EXPORTS
// =============================================================================

export { ExpenseRepository, ExpenseService }
