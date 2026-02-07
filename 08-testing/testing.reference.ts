/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TESTING WITH @effect/vitest - REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * @effect/vitest provides enhanced testing support for Effect code with
 * automatic Effect execution, scoped resources, and better error reporting.
 *
 * WHY @effect/vitest?
 * - Native Effect support: Run effects directly in tests
 * - Automatic cleanup: Scoped resources are cleaned up
 * - Test services: TestClock, TestRandom for deterministic tests
 * - Better errors: Full fiber dumps with causes and spans
 * - Layer support: Easy dependency injection in tests
 *
 * REAL EXAMPLE: api/tests/Services/*.test.ts
 *
 * DOCS: https://effect.website/docs/testing
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Context, Effect, Fiber, Layer, Option, Schema, TestClock } from "effect"
import { describe, expect, it } from "@effect/vitest"

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Basic Test Structure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Import test functions from @effect/vitest, not vitest directly.
 * This gives you Effect-aware versions of it, describe, expect.
 */

describe("Basic Testing", () => {
  // Regular synchronous test (still works)
  it("adds numbers", () => {
    expect(1 + 1).toBe(2)
  })

  // Effect test - returns an Effect
  it.effect("succeeds with value", () =>
    Effect.gen(function* () {
      const result = yield* Effect.succeed(42)
      expect(result).toBe(42)
    })
  )

  // Effect test with assertions inside
  it.effect("computes correctly", () =>
    Effect.gen(function* () {
      const a = yield* Effect.succeed(10)
      const b = yield* Effect.succeed(20)
      const sum = a + b
      expect(sum).toBe(30)
    })
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Testing with Services and Layers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Use Effect.provide to inject test layers.
 */

// Sample service
class Calculator extends Context.Tag("@test/Calculator")<
  Calculator,
  {
    readonly add: (a: number, b: number) => Effect.Effect<number>
    readonly multiply: (a: number, b: number) => Effect.Effect<number>
  }
>() {
  static readonly testLayer = Layer.succeed(Calculator, {
    add: (a, b) => Effect.succeed(a + b),
    multiply: (a, b) => Effect.succeed(a * b),
  })
}

describe("Testing with Layers", () => {
  it.effect("uses Calculator service", () =>
    Effect.gen(function* () {
      const calc = yield* Calculator
      const result = yield* calc.add(5, 3)
      expect(result).toBe(8)
    }).pipe(Effect.provide(Calculator.testLayer))
  )

  it.effect("chains calculations", () =>
    Effect.gen(function* () {
      const calc = yield* Calculator
      const sum = yield* calc.add(2, 3)
      const product = yield* calc.multiply(sum, 4)
      expect(product).toBe(20)
    }).pipe(Effect.provide(Calculator.testLayer))
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: Testing Error Cases
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Use Effect.flip to convert success/failure for easier assertions.
 */

const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type

class UserNotFound extends Schema.TaggedError<UserNotFound>()("UserNotFound", {
  id: UserId,
}) {}

class UserService extends Context.Tag("@test/UserService")<
  UserService,
  {
    readonly findById: (id: UserId) => Effect.Effect<{ name: string }, UserNotFound>
  }
>() {
  static readonly testLayer = Layer.succeed(UserService, {
    findById: (id) =>
      id === UserId.make("user-1")
        ? Effect.succeed({ name: "Alice" })
        : Effect.fail(new UserNotFound({ id })),
  })
}

describe("Testing Errors", () => {
  it.effect("returns user when found", () =>
    Effect.gen(function* () {
      const users = yield* UserService
      const user = yield* users.findById(UserId.make("user-1"))
      expect(user.name).toBe("Alice")
    }).pipe(Effect.provide(UserService.testLayer))
  )

  it.effect("fails when user not found", () =>
    Effect.gen(function* () {
      const users = yield* UserService

      // Effect.flip swaps success and failure
      // So we can assert on the error
      const error = yield* users.findById(UserId.make("unknown")).pipe(
        Effect.flip
      )

      expect(error._tag).toBe("UserNotFound")
      expect(error.id).toBe("unknown")
    }).pipe(Effect.provide(UserService.testLayer))
  )

  // Alternative: Use Effect.exit for more control
  it.effect("handles not found with exit", () =>
    Effect.gen(function* () {
      const users = yield* UserService
      const exit = yield* users.findById(UserId.make("missing")).pipe(
        Effect.exit
      )

      expect(exit._tag).toBe("Failure")
    }).pipe(Effect.provide(UserService.testLayer))
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: TestClock for Time-Based Tests
// ─────────────────────────────────────────────────────────────────────────────

/**
 * it.effect provides TestContext with a TestClock.
 * Use TestClock.adjust to simulate time passing.
 */

describe("Time-Based Tests", () => {
  // TestClock starts at 0
  it.effect("test clock starts at zero", () =>
    Effect.gen(function* () {
      const now = yield* Effect.sync(() => Date.now())
      // In test context, clock starts at 0
      // (Actually Effect.Clock.currentTimeMillis would be more accurate)
    })
  )

  // Simulate delays
  it.effect("simulates time passing", () =>
    Effect.gen(function* () {
      // Start a delayed effect
      const fiber = yield* Effect.delay(Effect.succeed("done"), "10 seconds").pipe(
        Effect.fork
      )

      // Advance time by 10 seconds
      yield* TestClock.adjust("10 seconds")

      // Now the fiber should complete
      const result = yield* Fiber.join(fiber)
      expect(result).toBe("done")
    })
  )

  // Test timeouts
  it.effect("tests timeout behavior", () =>
    Effect.gen(function* () {
      // An effect that takes "forever"
      const slow = Effect.never.pipe(Effect.timeout("5 seconds"))

      const fiber = yield* slow.pipe(Effect.fork)

      // Advance past timeout
      yield* TestClock.adjust("6 seconds")

      // Should have timed out (result is None)
      const result = yield* Fiber.join(fiber)
      expect(Option.isNone(result)).toBe(true)
    })
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: Test Modifiers
// ─────────────────────────────────────────────────────────────────────────────

describe("Test Modifiers", () => {
  // Skip a test
  it.effect.skip("skipped test", () =>
    Effect.gen(function* () {
      // This won't run
      expect(true).toBe(false)
    })
  )

  // Only run this test (uncomment to use)
  // it.effect.only("focused test", () =>
  //   Effect.gen(function* () {
  //     expect(1).toBe(1)
  //   })
  // )

  // Test expected to fail (for documenting known issues)
  it.effect.fails("known failing test", () =>
    Effect.gen(function* () {
      // This test is expected to fail
      expect(1 + 1).toBe(3)
    })
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: Scoped Tests (Resource Cleanup)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * it.scoped automatically handles resource cleanup.
 * Use for tests that create scoped resources.
 */

describe("Scoped Tests", () => {
  it.scoped("cleans up resources", () =>
    Effect.gen(function* () {
      let cleaned = false

      // Create a scoped resource
      yield* Effect.acquireRelease(
        Effect.sync(() => {
          console.log("Resource acquired")
          return "resource"
        }),
        () =>
          Effect.sync(() => {
            console.log("Resource released")
            cleaned = true
          })
      )

      // Resource is available here
      expect(cleaned).toBe(false)

      // When test ends, resource is automatically released
    })
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: Complete Example - Testing a Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A complete example testing a todo service.
 */

const TodoId = Schema.String.pipe(Schema.brand("TodoId"))
type TodoId = typeof TodoId.Type

class Todo extends Schema.Class<Todo>("Todo")({
  id: TodoId,
  title: Schema.String,
  completed: Schema.Boolean,
}) {}

class TodoNotFound extends Schema.TaggedError<TodoNotFound>()("TodoNotFound", {
  id: TodoId,
}) {}

class Todos extends Context.Tag("@test/Todos")<
  Todos,
  {
    readonly create: (title: string) => Effect.Effect<Todo>
    readonly findById: (id: TodoId) => Effect.Effect<Todo, TodoNotFound>
    readonly complete: (id: TodoId) => Effect.Effect<Todo, TodoNotFound>
    readonly all: () => Effect.Effect<readonly Todo[]>
  }
>() {
  static readonly testLayer = Layer.sync(Todos, () => {
    const store = new Map<TodoId, Todo>()

    return Todos.of({
      create: (title) =>
        Effect.sync(() => {
          const todo = Todo.make({
            id: TodoId.make(crypto.randomUUID()),
            title,
            completed: false,
          })
          store.set(todo.id, todo)
          return todo
        }),

      findById: (id) =>
        Effect.gen(function* () {
          const todo = store.get(id)
          if (!todo) return yield* new TodoNotFound({ id })
          return todo
        }),

      complete: (id) =>
        Effect.gen(function* () {
          const todo = store.get(id)
          if (!todo) return yield* new TodoNotFound({ id })
          const completed = Todo.make({ ...todo, completed: true })
          store.set(id, completed)
          return completed
        }),

      all: () => Effect.sync(() => [...store.values()]),
    })
  })
}

describe("Todos Service", () => {
  it.effect("creates a todo", () =>
    Effect.gen(function* () {
      const todos = yield* Todos
      const todo = yield* todos.create("Learn Effect")

      expect(todo.title).toBe("Learn Effect")
      expect(todo.completed).toBe(false)
    }).pipe(Effect.provide(Todos.testLayer))
  )

  it.effect("finds todo by id", () =>
    Effect.gen(function* () {
      const todos = yield* Todos
      const created = yield* todos.create("Test todo")
      const found = yield* todos.findById(created.id)

      expect(found.id).toBe(created.id)
      expect(found.title).toBe("Test todo")
    }).pipe(Effect.provide(Todos.testLayer))
  )

  it.effect("fails when todo not found", () =>
    Effect.gen(function* () {
      const todos = yield* Todos
      const error = yield* todos.findById(TodoId.make("missing")).pipe(
        Effect.flip
      )

      expect(error._tag).toBe("TodoNotFound")
    }).pipe(Effect.provide(Todos.testLayer))
  )

  it.effect("completes a todo", () =>
    Effect.gen(function* () {
      const todos = yield* Todos
      const created = yield* todos.create("Complete me")
      const completed = yield* todos.complete(created.id)

      expect(completed.completed).toBe(true)
    }).pipe(Effect.provide(Todos.testLayer))
  )

  it.effect("lists all todos", () =>
    Effect.gen(function* () {
      const todos = yield* Todos
      yield* todos.create("Todo 1")
      yield* todos.create("Todo 2")
      yield* todos.create("Todo 3")

      const all = yield* todos.all()
      expect(all.length).toBe(3)
    }).pipe(Effect.provide(Todos.testLayer))
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: Testing with Multiple Services
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compose multiple test layers for integration-style tests.
 */

class Notifications extends Context.Tag("@test/Notifications")<
  Notifications,
  {
    readonly send: (message: string) => Effect.Effect<void>
    readonly sent: () => Effect.Effect<readonly string[]>
  }
>() {
  static readonly testLayer = Layer.sync(Notifications, () => {
    const messages: string[] = []

    return Notifications.of({
      send: (message) => Effect.sync(() => void messages.push(message)),
      sent: () => Effect.sync(() => [...messages]),
    })
  })
}

// Combine layers
const testAppLayer = Todos.testLayer.pipe(
  Layer.provideMerge(Notifications.testLayer)
)

describe("Integration Tests", () => {
  it.effect("creates todo and sends notification", () =>
    Effect.gen(function* () {
      const todos = yield* Todos
      const notifications = yield* Notifications

      const todo = yield* todos.create("Important task")
      yield* notifications.send(`Created: ${todo.title}`)

      const sent = yield* notifications.sent()
      expect(sent).toContain("Created: Important task")
    }).pipe(Effect.provide(testAppLayer))
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: What NOT to Do (Anti-Patterns)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DON'T: Use await with Effect.runPromise in tests
 */

// WRONG - mixing async/await with Effect tests
// it("bad test", async () => {
//   const result = await Effect.runPromise(someEffect)
//   expect(result).toBe(42)
// })

// CORRECT - use it.effect
// it.effect("good test", () =>
//   Effect.gen(function* () {
//     const result = yield* someEffect
//     expect(result).toBe(42)
//   })
// )

/**
 * DON'T: Forget to provide layers
 */

// WRONG - will fail with missing service error
// it.effect("forgets layer", () =>
//   Effect.gen(function* () {
//     const todos = yield* Todos  // Error! No layer provided
//   })
// )

// CORRECT - always provide required layers
// it.effect("provides layer", () =>
//   Effect.gen(function* () {
//     const todos = yield* Todos
//   }).pipe(Effect.provide(Todos.testLayer))
// )

/**
 * DON'T: Share mutable state between tests
 */

// WRONG - tests affect each other
// const sharedStore = new Map()
//
// class BadService extends Context.Tag("Bad")<Bad, ...>() {
//   static readonly layer = Layer.succeed(Bad, { store: sharedStore })
// }

// CORRECT - create fresh state per test using Layer.sync
// class GoodService extends Context.Tag("Good")<Good, ...>() {
//   static readonly testLayer = Layer.sync(Good, () => {
//     const store = new Map()  // Fresh per test!
//     return { store }
//   })
// }

export {
  Calculator,
  UserService,
  UserNotFound,
  Todos,
  Todo,
  TodoNotFound,
  Notifications,
  testAppLayer,
}
