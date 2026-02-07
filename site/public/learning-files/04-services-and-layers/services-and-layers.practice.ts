/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SERVICES & LAYERS - PRACTICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Complete these exercises to master Effect services and layers.
 * Reference: ./services-and-layers.reference.ts
 *
 * Run with: bun run 04-services-and-layers/services-and-layers.practice.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Context, Effect, Layer, Schema } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1: Define a Simple Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a Clock service that provides time-related operations.
 *
 * Interface:
 * - now: () => Effect.Effect<Date>
 * - timestamp: () => Effect.Effect<number> (milliseconds since epoch)
 * - formatted: () => Effect.Effect<string> (ISO string format)
 *
 * Then create:
 * 1. A production layer that uses real Date
 * 2. A test layer that returns a fixed date (2024-01-15T10:00:00.000Z)
 */

// class Clock extends Context.Tag("@app/Clock")<
//   Clock,
//   {
//     ???
//   }
// >() {
//   static readonly layer = ???
//   static readonly testLayer = ???
// }

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2: Create a Service with Dependencies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a TimeLogger service that depends on Clock and logs timestamps.
 *
 * Interface:
 * - logWithTimestamp: (message: string) => Effect.Effect<void>
 *
 * The service should:
 * 1. Get the current formatted time from Clock
 * 2. Log the message with the timestamp prefix: "[2024-01-15T10:00:00.000Z] message"
 *
 * Create both layer (depends on Clock) and testLayer.
 */

// class TimeLogger extends Context.Tag("@app/TimeLogger")<
//   TimeLogger,
//   {
//     ???
//   }
// >() {
//   static readonly layer = ???
// }

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3: Build a Domain Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a complete Todo service for a task management app.
 *
 * First, define the types:
 * - TodoId: branded string
 * - Todo: Schema.Class with id, title, completed, createdAt
 * - TodoNotFound: Schema.TaggedError
 *
 * Then create the service:
 * - create: (title: string) => Effect.Effect<Todo>
 * - findById: (id: TodoId) => Effect.Effect<Todo, TodoNotFound>
 * - complete: (id: TodoId) => Effect.Effect<Todo, TodoNotFound>
 * - all: () => Effect.Effect<readonly Todo[]>
 * - pending: () => Effect.Effect<readonly Todo[]>
 *
 * Create a testLayer with in-memory storage.
 */

// const TodoId = Schema.String.pipe(Schema.brand("TodoId"))
// type TodoId = typeof TodoId.Type

// class Todo extends Schema.Class<Todo>("Todo")({
//   ???
// }) {}

// class TodoNotFound extends Schema.TaggedError<TodoNotFound>()("TodoNotFound", {
//   ???
// }) {}

// class Todos extends Context.Tag("@app/Todos")<
//   Todos,
//   {
//     ???
//   }
// >() {
//   static readonly testLayer = ???
// }

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4: Compose Multiple Services
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a TodoApp service that orchestrates Todos and TimeLogger.
 *
 * Interface:
 * - createTodo: (title: string) => Effect.Effect<Todo>
 *   (logs "Creating todo: {title}" with timestamp, then creates todo)
 *
 * - completeTodo: (id: TodoId) => Effect.Effect<Todo, TodoNotFound>
 *   (logs "Completing todo: {id}" with timestamp, then completes todo)
 *
 * - summarize: () => Effect.Effect<string>
 *   (returns "Total: X, Pending: Y, Completed: Z")
 *
 * Create the layer that depends on Todos and TimeLogger.
 */

// class TodoApp extends Context.Tag("@app/TodoApp")<
//   TodoApp,
//   {
//     ???
//   }
// >() {
//   static readonly layer = ???
// }

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5: Build the Full Application Layer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Compose all services into a complete application layer.
 *
 * Create:
 * 1. testAppLayer - combines all test layers
 * 2. An appProgram that:
 *    - Creates 3 todos
 *    - Completes the first one
 *    - Returns the summary
 *
 * 3. A runnable main effect with the layer provided
 */

// const testAppLayer = ???

// const appProgram = Effect.gen(function* () {
//   ???
// })

// const main = appProgram.pipe(Effect.provide(testAppLayer))

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 6: Service with External Dependency
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a Cache service that could be backed by different implementations.
 *
 * Interface:
 * - get: (key: string) => Effect.Effect<string | null>
 * - set: (key: string, value: string, ttlSeconds?: number) => Effect.Effect<void>
 * - delete: (key: string) => Effect.Effect<boolean>
 * - clear: () => Effect.Effect<void>
 *
 * Create:
 * 1. memoryLayer - in-memory Map implementation
 * 2. A program that demonstrates using the cache
 */

// class Cache extends Context.Tag("@app/Cache")<
//   Cache,
//   {
//     ???
//   }
// >() {
//   static readonly memoryLayer = ???
// }

// const cacheDemo = Effect.gen(function* () {
//   ???
// })

// ─────────────────────────────────────────────────────────────────────────────
// TEST YOUR SOLUTIONS
// ─────────────────────────────────────────────────────────────────────────────

const mainTest = Effect.gen(function* () {
  yield* Effect.logInfo("=== Services & Layers Practice ===")

  // Exercise 1: Test Clock service
  // const clock = yield* Clock
  // const now = yield* clock.now()
  // yield* Effect.logInfo(`Current time: ${now.toISOString()}`)

  // Exercise 2: Test TimeLogger service
  // const timeLogger = yield* TimeLogger
  // yield* timeLogger.logWithTimestamp("Hello from TimeLogger!")

  // Exercise 3: Test Todos service
  // const todos = yield* Todos
  // const todo = yield* todos.create("Learn Effect")
  // yield* Effect.logInfo(`Created todo: ${todo.title}`)

  // Exercise 4: Test TodoApp service
  // const app = yield* TodoApp
  // yield* app.createTodo("Exercise 1")
  // yield* app.createTodo("Exercise 2")
  // const summary = yield* app.summarize()
  // yield* Effect.logInfo(summary)

  // Exercise 6: Test Cache service
  // const cache = yield* Cache
  // yield* cache.set("name", "Alice")
  // const name = yield* cache.get("name")
  // yield* Effect.logInfo(`Cached name: ${name}`)

  yield* Effect.logInfo("All exercises completed!")
})

// Uncomment to run with your layers:
// Effect.runPromise(mainTest.pipe(Effect.provide(testAppLayer)))
//   .then(() => console.log("Done!"))
//   .catch(console.error)

export { mainTest }
