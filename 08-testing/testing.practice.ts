/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TESTING WITH @effect/vitest - PRACTICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Complete these exercises to master Effect testing.
 * Reference: ./testing.reference.ts
 *
 * Run with: bun run test (after configuring vitest)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Context, Effect, Layer, Schema } from "effect"
import { describe, expect, it } from "@effect/vitest"

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1: Basic Effect Tests
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Write basic Effect tests.
 *
 * 1. Test that Effect.succeed(10) yields 10
 * 2. Test that Effect.map(Effect.succeed(5), n => n * 2) yields 10
 * 3. Test that Effect.all([Effect.succeed(1), Effect.succeed(2)]) yields [1, 2]
 */

describe("Exercise 1: Basic Effect Tests", () => {
  // it.effect("succeeds with value", () =>
  //   Effect.gen(function* () {
  //     ???
  //   })
  // )

  // it.effect("maps values", () =>
  //   Effect.gen(function* () {
  //     ???
  //   })
  // )

  // it.effect("combines effects", () =>
  //   Effect.gen(function* () {
  //     ???
  //   })
  // )
})

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2: Testing with a Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a Counter service and test it.
 *
 * Service interface:
 * - get: () => Effect.Effect<number>
 * - increment: () => Effect.Effect<number> (returns new value)
 * - decrement: () => Effect.Effect<number> (returns new value)
 * - reset: () => Effect.Effect<void>
 *
 * Create a testLayer with in-memory state.
 * Write tests for each method.
 */

// class Counter extends Context.Tag("@test/Counter")<
//   Counter,
//   {
//     ???
//   }
// >() {
//   static readonly testLayer = ???
// }

describe("Exercise 2: Counter Service", () => {
  // it.effect("starts at zero", () =>
  //   Effect.gen(function* () {
  //     ???
  //   }).pipe(Effect.provide(Counter.testLayer))
  // )

  // it.effect("increments", () => ???)

  // it.effect("decrements", () => ???)

  // it.effect("resets to zero", () => ???)
})

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3: Testing Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a Divider service that can fail.
 *
 * Service interface:
 * - divide: (a: number, b: number) => Effect.Effect<number, DivisionByZero>
 *
 * Error: DivisionByZero (TaggedError with dividend field)
 *
 * Write tests:
 * 1. Successful division
 * 2. Division by zero fails with correct error
 */

// class DivisionByZero extends Schema.TaggedError<DivisionByZero>()(
//   "DivisionByZero",
//   {
//     ???
//   }
// ) {}

// class Divider extends Context.Tag("@test/Divider")<
//   Divider,
//   {
//     ???
//   }
// >() {
//   static readonly testLayer = ???
// }

describe("Exercise 3: Error Testing", () => {
  // it.effect("divides successfully", () => ???)

  // it.effect("fails on division by zero", () =>
  //   Effect.gen(function* () {
  //     const divider = yield* Divider
  //     const error = yield* divider.divide(10, 0).pipe(Effect.flip)
  //     expect(error._tag).toBe("DivisionByZero")
  //     ???
  //   }).pipe(Effect.provide(Divider.testLayer))
  // )
})

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4: Testing with Multiple Services
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a ShoppingCart service that depends on Inventory.
 *
 * Inventory service:
 * - getStock: (item: string) => Effect.Effect<number>
 * - reserve: (item: string, quantity: number) => Effect.Effect<void, OutOfStock>
 *
 * ShoppingCart service:
 * - addItem: (item: string, quantity: number) => Effect.Effect<void, OutOfStock>
 * - getItems: () => Effect.Effect<Map<string, number>>
 * - checkout: () => Effect.Effect<string> (returns order id)
 *
 * Error: OutOfStock (with item and requested fields)
 *
 * Write tests for the cart that provide both layers.
 */

// class OutOfStock extends Schema.TaggedError<OutOfStock>()("OutOfStock", {
//   ???
// }) {}

// class Inventory extends Context.Tag("@test/Inventory")<
//   Inventory,
//   {
//     ???
//   }
// >() {
//   static readonly testLayer = ???
// }

// class ShoppingCart extends Context.Tag("@test/ShoppingCart")<
//   ShoppingCart,
//   {
//     ???
//   }
// >() {
//   static readonly layer = ??? // depends on Inventory
// }

// const shoppingTestLayer = ???

describe("Exercise 4: Multiple Services", () => {
  // it.effect("adds items to cart", () => ???)

  // it.effect("fails when out of stock", () => ???)

  // it.effect("checks out successfully", () => ???)
})

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5: Complete Test Suite
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a complete test suite for a UserManager service.
 *
 * Domain:
 * - UserId: branded string
 * - User: { id, email, name, createdAt }
 * - UserNotFound, EmailAlreadyExists errors
 *
 * Service:
 * - create: (email, name) => Effect.Effect<User, EmailAlreadyExists>
 * - findById: (id) => Effect.Effect<User, UserNotFound>
 * - findByEmail: (email) => Effect.Effect<User | null>
 * - delete: (id) => Effect.Effect<void, UserNotFound>
 *
 * Write comprehensive tests:
 * 1. Create user successfully
 * 2. Find user by id
 * 3. Find user by email
 * 4. Fail to create duplicate email
 * 5. Fail to find non-existent user
 * 6. Delete user
 * 7. Fail to delete non-existent user
 */

// Your implementation here...

describe("Exercise 5: UserManager", () => {
  // Your tests here...
})

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT FOR RUNNING
// ─────────────────────────────────────────────────────────────────────────────

// Tests run automatically with vitest
// Run: bun run test
