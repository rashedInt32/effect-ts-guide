/**
 * =============================================================================
 * ADVANCED EFFECT PATTERNS - REFERENCE
 * =============================================================================
 *
 * Prerequisites: Complete modules 00-05 first!
 *
 * This module covers ADVANCED patterns that make Effect powerful for
 * real-world applications. These are patterns you'll reach for when
 * basic Effect composition isn't enough.
 *
 * TABLE OF CONTENTS:
 *   1. Effect.gen vs pipe - When to use which style
 *   2. Concurrency - Effect.all options, race, fork/join
 *   3. Resource Management - acquireRelease, Scope, scoped
 *   4. State Management - Ref for mutable state in functional code
 *   5. Scheduling - Schedule for retries and repetition
 *   6. Interruption - Cancellation and timeouts
 *   7. Streams (Brief Intro) - When Effect isn't enough
 *   8. Common Patterns - Real-world recipes
 *   9. Anti-Patterns - What NOT to do
 *
 * DOCS: https://effect.website/docs/concurrency/basic-concurrency
 *
 * =============================================================================
 */

import { Console, Duration, Effect, Exit, Fiber, Option, pipe, Ref, Schedule, Scope, Stream } from "effect"

// =============================================================================
// SECTION 1: Effect.gen vs pipe - WHEN TO USE WHICH
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     Effect.gen vs pipe: DECISION GUIDE                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  USE Effect.gen WHEN:                                                     ║
 * ║  ────────────────────                                                     ║
 * ║  - Complex control flow (if/else, loops, try/catch patterns)              ║
 * ║  - You need to use intermediate values multiple times                     ║
 * ║  - Building business logic with many sequential steps                     ║
 * ║  - Coming from async/await and want familiar syntax                       ║
 * ║  - Debugging - easier to set breakpoints                                  ║
 * ║                                                                           ║
 * ║  USE pipe WHEN:                                                           ║
 * ║  ───────────────                                                          ║
 * ║  - Simple linear transformations (A → B → C)                              ║
 * ║  - One-liners or short 2-3 step chains                                    ║
 * ║  - You want point-free style                                              ║
 * ║  - Composing reusable pipelines                                           ║
 * ║  - Adding error handling/logging to existing effects                      ║
 * ║                                                                           ║
 * ║  RULE OF THUMB:                                                           ║
 * ║  "If you're thinking about variable names, use Effect.gen"                ║
 * ║  "If it's just transformations, use pipe"                                 ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1a. Same logic, two styles - SEE THE DIFFERENCE
// ─────────────────────────────────────────────────────────────────────────────

// Scenario: Validate user, fetch their orders, calculate total

// USING Effect.gen - Better when you have complex logic
const processUserGen = (userId: string) =>
  Effect.gen(function* () {
    // Each step has a clear name
    const user = yield* fetchUser(userId)

    // Easy to add conditional logic
    if (user.status === "suspended") {
      return yield* Effect.fail("User is suspended" as const)
    }

    // Can use intermediate values multiple times
    yield* Effect.logInfo(`Processing orders for ${user.name}`)
    const orders = yield* fetchOrders(user.id)

    // Complex calculation with access to both user and orders
    const total = orders.reduce((sum, o) => sum + o.amount, 0)
    const discount = user.isPremium ? 0.1 : 0

    return {
      user: user.name,
      orderCount: orders.length,
      total: total * (1 - discount),
    }
  })

// USING pipe - Better for linear transformations
const processUserPipe = (userId: string) =>
  fetchUser(userId).pipe(
    Effect.filterOrFail(
      (user) => user.status !== "suspended",
      () => "User is suspended" as const
    ),
    Effect.tap((user) => Effect.logInfo(`Processing orders for ${user.name}`)),
    Effect.flatMap((user) =>
      fetchOrders(user.id).pipe(
        Effect.map((orders) => ({
          user: user.name,
          orderCount: orders.length,
          total: orders.reduce((sum, o) => sum + o.amount, 0) * (user.isPremium ? 0.9 : 1),
        }))
      )
    )
  )

// Helper functions for examples
const fetchUser = (id: string) =>
  Effect.succeed({ id, name: "Alice", status: "active" as "active" | "suspended", isPremium: true })
const fetchOrders = (userId: string) =>
  Effect.succeed([
    { id: "1", amount: 100 },
    { id: "2", amount: 50 },
  ])

// ─────────────────────────────────────────────────────────────────────────────
// 1b. Mixing styles - TOTALLY FINE!
// ─────────────────────────────────────────────────────────────────────────────

// You can mix! Use gen for the main logic, pipe for transformations
const mixedStyle = Effect.gen(function* () {
  const rawData = yield* Effect.succeed({ value: 10, multiplier: 2 })

  // Use pipe for a quick transformation chain
  const processed = yield* Effect.succeed(rawData.value).pipe(
    Effect.map((v) => v * rawData.multiplier),
    Effect.map((v) => v + 5),
    Effect.map((v) => `Result: ${v}`)
  )

  return processed
})

// =============================================================================
// SECTION 2: CONCURRENCY - Running Effects in Parallel
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                        CONCURRENCY: QUICK REFERENCE                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  RUNNING MULTIPLE EFFECTS:                                                ║
 * ║  ──────────────────────────                                               ║
 * ║  Effect.all([...])                    Sequential (default)                ║
 * ║  Effect.all([...], {concurrency: N})  Up to N at once                     ║
 * ║  Effect.all([...], {concurrency: "unbounded"})  All at once (Promise.all) ║
 * ║                                                                           ║
 * ║  RACING:                                                                  ║
 * ║  ────────                                                                 ║
 * ║  Effect.race(a, b)         First to succeed wins                          ║
 * ║  Effect.raceAll([...])     First of many to succeed                       ║
 * ║                                                                           ║
 * ║  FORKING (Advanced):                                                      ║
 * ║  ───────────────────                                                      ║
 * ║  Effect.fork(effect)       Run in background, get Fiber                   ║
 * ║  Fiber.join(fiber)         Wait for result                                ║
 * ║  Fiber.interrupt(fiber)    Cancel it                                      ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 2a. Effect.all with concurrency options
// ─────────────────────────────────────────────────────────────────────────────

// Simulate API calls with delay
const fetchUserData = (id: number) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Fetching user ${id}...`)
    yield* Effect.sleep("100 millis")
    return { id, name: `User ${id}` }
  })

// SEQUENTIAL (default) - One after another
// Total time: 100ms * 3 = 300ms
const sequential = Effect.all([fetchUserData(1), fetchUserData(2), fetchUserData(3)])
// Output order: User 1 → User 2 → User 3

// CONCURRENT with limit - Up to 2 at a time
// Total time: ~200ms (2 batches)
const limitedConcurrency = Effect.all([fetchUserData(1), fetchUserData(2), fetchUserData(3)], {
  concurrency: 2,
})

// UNBOUNDED - All at once (like Promise.all)
// Total time: ~100ms (all parallel)
const unboundedConcurrency = Effect.all([fetchUserData(1), fetchUserData(2), fetchUserData(3)], {
  concurrency: "unbounded",
})

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ PROMISE COMPARISON:                                                     │
 * │                                                                         │
 * │ Promise.all([p1, p2, p3])                                               │
 * │   = Effect.all([e1, e2, e3], { concurrency: "unbounded" })              │
 * │                                                                         │
 * │ For sequential, in Promise you'd need:                                  │
 * │   const r1 = await p1; const r2 = await p2; const r3 = await p3;        │
 * │   = Effect.all([e1, e2, e3])  // Sequential is default!                 │
 * │                                                                         │
 * │ For limited concurrency, in Promise you'd need p-limit library          │
 * │   = Effect.all([...], { concurrency: 2 })  // Built in!                 │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

// ─────────────────────────────────────────────────────────────────────────────
// 2b. Effect.all with objects (RECOMMENDED for readability)
// ─────────────────────────────────────────────────────────────────────────────

// Instead of destructuring arrays, use objects!
const fetchDashboardData = Effect.all(
  {
    user: fetchUserData(1),
    orders: Effect.succeed([{ id: "o1" }, { id: "o2" }]),
    notifications: Effect.succeed(["Welcome!", "You have 3 unread messages"]),
  },
  { concurrency: "unbounded" }
)
// Type: Effect<{ user: {...}, orders: [...], notifications: [...] }, never, never>

// Much cleaner than:
// const [user, orders, notifications] = await Effect.runPromise(Effect.all([...]))

// ─────────────────────────────────────────────────────────────────────────────
// 2c. Effect.race - First to succeed wins
// ─────────────────────────────────────────────────────────────────────────────

// Useful for: fallbacks, timeouts, fastest server

const fastServer = Effect.gen(function* () {
  yield* Effect.sleep("50 millis")
  return "Response from fast server"
})

const slowServer = Effect.gen(function* () {
  yield* Effect.sleep("200 millis")
  return "Response from slow server"
})

// Race! Fast server wins, slow server is automatically interrupted
const raceExample = Effect.race(fastServer, slowServer)
// Result: "Response from fast server"

// Race multiple with raceAll
const raceMany = Effect.raceAll([
  Effect.sleep("100 millis").pipe(Effect.as("server-a")),
  Effect.sleep("50 millis").pipe(Effect.as("server-b")),
  Effect.sleep("150 millis").pipe(Effect.as("server-c")),
])
// Result: "server-b" (fastest)

// ─────────────────────────────────────────────────────────────────────────────
// 2d. Effect.fork and Fiber - Background tasks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fibers are like lightweight threads. You can:
 * - Start a task in the background
 * - Continue doing other work
 * - Later join (wait for) or interrupt (cancel) the fiber
 *
 * ANALOGY: Like starting a download and then doing other stuff
 *          while it downloads in the background.
 */

const backgroundTask = Effect.gen(function* () {
  yield* Effect.logInfo("Background task starting...")
  yield* Effect.sleep("1 second")
  yield* Effect.logInfo("Background task done!")
  return "Background result"
})

const withFork = Effect.gen(function* () {
  // Fork starts the effect in the background, returns immediately
  const fiber = yield* Effect.fork(backgroundTask)
  //    ^^^^^
  //    Fiber<string, never> - handle to the running effect

  // Do other work while background task runs
  yield* Effect.logInfo("Doing other work...")
  yield* Effect.sleep("500 millis")
  yield* Effect.logInfo("Other work done!")

  // Now wait for the background task to complete
  const result = yield* Fiber.join(fiber)
  //                     ^^^^^^^^^^^
  //                     Wait for the fiber and get its result

  return result
})

// ─────────────────────────────────────────────────────────────────────────────
// 2e. Fiber interruption - Cancelling tasks
// ─────────────────────────────────────────────────────────────────────────────

const interruptExample = Effect.gen(function* () {
  const longTask = Effect.gen(function* () {
    yield* Effect.logInfo("Long task started...")
    yield* Effect.sleep("10 seconds")
    return "I'll never complete"
  })

  const fiber = yield* Effect.fork(longTask)

  // Wait a bit then cancel
  yield* Effect.sleep("100 millis")
  yield* Effect.logInfo("Interrupting the long task!")
  yield* Fiber.interrupt(fiber)
  //     ^^^^^^^^^^^^^^^^^
  //     Cancels the fiber immediately

  yield* Effect.logInfo("Long task was cancelled")
})

// =============================================================================
// SECTION 3: RESOURCE MANAGEMENT - Handling Cleanup
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    RESOURCE MANAGEMENT: QUICK REFERENCE                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  THE PROBLEM:                                                             ║
 * ║  ─────────────                                                            ║
 * ║  Resources (DB connections, file handles, sockets) need cleanup.          ║
 * ║  If you forget to cleanup, you get resource leaks!                        ║
 * ║                                                                           ║
 * ║  PROMISE APPROACH (manual, error-prone):                                  ║
 * ║    const conn = await openConnection()                                    ║
 * ║    try {                                                                  ║
 * ║      await doWork(conn)                                                   ║
 * ║    } finally {                                                            ║
 * ║      await conn.close()  // Easy to forget!                               ║
 * ║    }                                                                      ║
 * ║                                                                           ║
 * ║  EFFECT APPROACH (automatic, safe):                                       ║
 * ║    Effect.acquireRelease(                                                 ║
 * ║      openConnection,      // How to get the resource                      ║
 * ║      (conn) => conn.close // How to release (ALWAYS runs)                 ║
 * ║    )                                                                      ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 3a. Effect.acquireRelease - The core pattern
// ─────────────────────────────────────────────────────────────────────────────

// Simulate a database connection
interface DbConnection {
  id: string
  query: (sql: string) => Effect.Effect<unknown[], never, never>
}

const openConnection = Effect.gen(function* () {
  const id = `conn-${Date.now()}`
  yield* Effect.logInfo(`Opening connection ${id}`)
  return {
    id,
    query: (sql: string) => Effect.succeed([{ result: sql }]),
  } satisfies DbConnection
})

const closeConnection = (conn: DbConnection) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Closing connection ${conn.id}`)
  })

// Create a "scoped" resource
const dbConnection = Effect.acquireRelease(
  openConnection, // Acquire
  closeConnection // Release (ALWAYS runs, even on error/interrupt)
)
// Type: Effect<DbConnection, never, Scope>
//                                   ^^^^^
//                                   Requires a Scope to manage lifetime

// ─────────────────────────────────────────────────────────────────────────────
// 3b. Using scoped resources with Effect.scoped
// ─────────────────────────────────────────────────────────────────────────────

const useDatabase = Effect.gen(function* () {
  // Get the connection (will be auto-closed when scope ends)
  const conn = yield* dbConnection

  // Use it
  const users = yield* conn.query("SELECT * FROM users")
  yield* Effect.logInfo(`Got ${users.length} users`)

  return users
}).pipe(Effect.scoped)
//      ^^^^^^^^^^^^^^
//      This creates and manages the Scope
//      Connection is closed when this effect completes

// What happens:
// 1. Scope created
// 2. Connection opened
// 3. Query runs
// 4. Scope ends → Connection closed automatically
// Even if query throws, connection is still closed!

// ─────────────────────────────────────────────────────────────────────────────
// 3c. Multiple resources - compose them!
// ─────────────────────────────────────────────────────────────────────────────

// Simulate a file handle
interface FileHandle {
  path: string
  read: () => Effect.Effect<string, never, never>
}

const openFile = (path: string) =>
  Effect.acquireRelease(
    Effect.gen(function* () {
      yield* Effect.logInfo(`Opening file ${path}`)
      return { path, read: () => Effect.succeed(`Contents of ${path}`) } satisfies FileHandle
    }),
    (handle) => Effect.logInfo(`Closing file ${handle.path}`)
  )

// Use multiple resources - they're all cleaned up in reverse order!
const multiResource = Effect.gen(function* () {
  const conn = yield* dbConnection
  const configFile = yield* openFile("/etc/config.json")
  const logFile = yield* openFile("/var/log/app.log")

  const config = yield* configFile.read()
  const users = yield* conn.query("SELECT * FROM users")

  return { config, userCount: users.length }
}).pipe(Effect.scoped)

// Cleanup order: logFile → configFile → conn (reverse of acquisition)

// ─────────────────────────────────────────────────────────────────────────────
// 3d. Effect.ensuring - Simpler cleanup for one-off cases
// ─────────────────────────────────────────────────────────────────────────────

// When you just need to run cleanup code, not manage a resource
const withCleanup = Effect.gen(function* () {
  yield* Effect.logInfo("Doing some work...")
  return "result"
}).pipe(
  Effect.ensuring(Effect.logInfo("Cleanup runs no matter what!"))
  //     ^^^^^^^^^
  //     Like finally {} block
)

// =============================================================================
// SECTION 4: STATE MANAGEMENT - Ref for Mutable State
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                        Ref: MUTABLE STATE IN EFFECT                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  THE PROBLEM:                                                             ║
 * ║  ─────────────                                                            ║
 * ║  Sometimes you need mutable state (counters, caches, accumulators).       ║
 * ║  Using `let` variables is:                                                ║
 * ║    - Not safe with concurrent effects                                     ║
 * ║    - Hard to test                                                         ║
 * ║    - Not tracked by the type system                                       ║
 * ║                                                                           ║
 * ║  Ref is like a "box" that holds a value you can read/update.              ║
 * ║                                                                           ║
 * ║  OPERATIONS:                                                              ║
 * ║  ───────────                                                              ║
 * ║  Ref.make(initial)    Create a Ref with initial value                     ║
 * ║  Ref.get(ref)         Read current value                                  ║
 * ║  Ref.set(ref, value)  Set to new value                                    ║
 * ║  Ref.update(ref, fn)  Update using a function                             ║
 * ║  Ref.modify(ref, fn)  Update and return something                         ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 4a. Basic Ref usage
// ─────────────────────────────────────────────────────────────────────────────

const counterExample = Effect.gen(function* () {
  // Create a Ref holding a number
  const counter = yield* Ref.make(0)
  //              ^^^^^^^^^^^^^^^^^
  //              Type: Ref<number>

  // Read the value
  const initial = yield* Ref.get(counter)
  yield* Effect.logInfo(`Initial: ${initial}`) // 0

  // Update using a function
  yield* Ref.update(counter, (n) => n + 1)
  yield* Ref.update(counter, (n) => n + 1)
  yield* Ref.update(counter, (n) => n + 1)

  // Read final value
  const final = yield* Ref.get(counter)
  yield* Effect.logInfo(`Final: ${final}`) // 3

  return final
})

// ─────────────────────────────────────────────────────────────────────────────
// 4b. Ref with complex state
// ─────────────────────────────────────────────────────────────────────────────

interface AppState {
  users: string[]
  requestCount: number
  lastUpdated: Date
}

const statefulApp = Effect.gen(function* () {
  const state = yield* Ref.make<AppState>({
    users: [],
    requestCount: 0,
    lastUpdated: new Date(),
  })

  // Add a user
  yield* Ref.update(state, (s) => ({
    ...s,
    users: [...s.users, "Alice"],
    requestCount: s.requestCount + 1,
    lastUpdated: new Date(),
  }))

  // Add another user
  yield* Ref.update(state, (s) => ({
    ...s,
    users: [...s.users, "Bob"],
    requestCount: s.requestCount + 1,
    lastUpdated: new Date(),
  }))

  const finalState = yield* Ref.get(state)
  return finalState
})

// ─────────────────────────────────────────────────────────────────────────────
// 4c. Ref.modify - Update and return in one step
// ─────────────────────────────────────────────────────────────────────────────

const modifyExample = Effect.gen(function* () {
  const queue = yield* Ref.make<string[]>(["task1", "task2", "task3"])

  // Pop an item from the queue
  const nextTask = yield* Ref.modify(queue, (tasks) => {
    const [first, ...rest] = tasks
    return [first, rest] // [returnValue, newState]
    //      ^^^^^  ^^^^
    //      This is returned, this becomes new state
  })

  yield* Effect.logInfo(`Processing: ${nextTask}`) // "task1"

  const remaining = yield* Ref.get(queue)
  yield* Effect.logInfo(`Remaining: ${remaining}`) // ["task2", "task3"]
})

// ─────────────────────────────────────────────────────────────────────────────
// 4d. Ref is CONCURRENT-SAFE!
// ─────────────────────────────────────────────────────────────────────────────

// Multiple concurrent updates are safe with Ref
const concurrentCounter = Effect.gen(function* () {
  const counter = yield* Ref.make(0)

  // Run 100 increments concurrently
  yield* Effect.all(
    Array.from({ length: 100 }, () => Ref.update(counter, (n) => n + 1)),
    { concurrency: "unbounded" }
  )

  const final = yield* Ref.get(counter)
  // final is ALWAYS 100, never less due to race conditions!

  return final
})

// Compare to UNSAFE approach with let:
// let counter = 0
// await Promise.all(Array(100).fill(0).map(async () => {
//   counter++  // UNSAFE! Race condition! Final might be < 100
// }))

// =============================================================================
// SECTION 5: SCHEDULING - Retries and Repetition
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      Schedule: RETRY & REPEAT PATTERNS                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  Schedule describes WHEN to retry or repeat an effect.                    ║
 * ║                                                                           ║
 * ║  COMMON SCHEDULES:                                                        ║
 * ║  ──────────────────                                                       ║
 * ║  Schedule.recurs(n)           Repeat n times                              ║
 * ║  Schedule.spaced(duration)    Fixed delay between retries                 ║
 * ║  Schedule.exponential(base)   Exponential backoff                         ║
 * ║  Schedule.forever             Repeat forever                              ║
 * ║                                                                           ║
 * ║  COMBINATORS:                                                             ║
 * ║  ─────────────                                                            ║
 * ║  schedule1.pipe(Schedule.compose(schedule2))  Both must continue          ║
 * ║  Schedule.union(s1, s2)                       Either continues             ║
 * ║                                                                           ║
 * ║  USAGE:                                                                   ║
 * ║  ───────                                                                  ║
 * ║  effect.pipe(Effect.retry(schedule))   Retry on failure                   ║
 * ║  effect.pipe(Effect.repeat(schedule))  Repeat on success                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 5a. Basic retry patterns
// ─────────────────────────────────────────────────────────────────────────────

// Simulate a flaky API
let attemptCount = 0
const flakyApi = Effect.gen(function* () {
  attemptCount++
  if (attemptCount < 3) {
    yield* Effect.logWarning(`Attempt ${attemptCount} failed!`)
    return yield* Effect.fail("Network error" as const)
  }
  return "Success!"
})

// Retry up to 5 times
const withRetry = flakyApi.pipe(Effect.retry(Schedule.recurs(5)))

// Retry with delay between attempts (1 second apart)
const withDelayedRetry = flakyApi.pipe(Effect.retry(Schedule.spaced("1 second")))

// Exponential backoff: 100ms, 200ms, 400ms, 800ms...
const withExponentialBackoff = flakyApi.pipe(
  Effect.retry(Schedule.exponential("100 millis"))
)

// ─────────────────────────────────────────────────────────────────────────────
// 5b. Combining schedules - Real-world patterns
// ─────────────────────────────────────────────────────────────────────────────

// Exponential backoff with max 5 retries
const exponentialWithLimit = Schedule.exponential("100 millis").pipe(
  Schedule.compose(Schedule.recurs(5))
)

// Exponential backoff with max delay of 10 seconds
const exponentialWithCap = Schedule.exponential("100 millis").pipe(
  Schedule.compose(Schedule.recurWhile((delay) => Duration.lessThan(delay, Duration.seconds(10))))
)

// Jittered exponential (adds randomness to avoid thundering herd)
const jitteredExponential = Schedule.exponential("100 millis").pipe(Schedule.jittered)

// Real-world API retry strategy:
// - Exponential backoff starting at 100ms
// - Max 5 retries
// - Add jitter
// - Max delay 30 seconds
const productionRetryStrategy = Schedule.exponential("100 millis").pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(5))
)

// Use it
const robustApiCall = flakyApi.pipe(Effect.retry(productionRetryStrategy))

// ─────────────────────────────────────────────────────────────────────────────
// 5c. Effect.repeat - For success cases
// ─────────────────────────────────────────────────────────────────────────────

// Poll an API every 5 seconds
const pollApi = Effect.gen(function* () {
  const data = yield* Effect.succeed({ status: "ok", timestamp: Date.now() })
  yield* Effect.logInfo(`Polled: ${JSON.stringify(data)}`)
  return data
})

// Repeat forever with 5 second delay
const polling = pollApi.pipe(Effect.repeat(Schedule.spaced("5 seconds")))

// Repeat 10 times
const limitedPolling = pollApi.pipe(Effect.repeat(Schedule.recurs(10)))

// ─────────────────────────────────────────────────────────────────────────────
// 5d. Schedule with conditional logic
// ─────────────────────────────────────────────────────────────────────────────

// Only retry specific errors
const selectiveRetry = Effect.gen(function* () {
  const random = Math.random()
  if (random < 0.5) {
    return yield* Effect.fail({ _tag: "NetworkError" as const })
  }
  if (random < 0.7) {
    return yield* Effect.fail({ _tag: "ValidationError" as const })
  }
  return "Success!"
}).pipe(
  Effect.retry({
    schedule: Schedule.recurs(3),
    while: (error) => error._tag === "NetworkError", // Only retry network errors
  })
)

// =============================================================================
// SECTION 6: INTERRUPTION - Timeouts and Cancellation
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    INTERRUPTION: TIMEOUTS & CANCELLATION                   ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  Effect supports interruption (cancellation) built-in.                    ║
 * ║                                                                           ║
 * ║  TIMEOUT PATTERNS:                                                        ║
 * ║  ─────────────────                                                        ║
 * ║  Effect.timeout(duration)              Returns Option (None on timeout)   ║
 * ║  Effect.timeoutFail({...})             Fail with custom error             ║
 * ║  Effect.timeoutTo({...})               Return fallback value              ║
 * ║                                                                           ║
 * ║  INTERRUPTION PATTERNS:                                                   ║
 * ║  ───────────────────────                                                  ║
 * ║  Effect.uninterruptible(effect)        Can't be cancelled                 ║
 * ║  Effect.interruptible(effect)          Can be cancelled                   ║
 * ║  Effect.disconnect(effect)             Ignore parent interruption         ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 6a. Timeouts
// ─────────────────────────────────────────────────────────────────────────────

const slowOperation = Effect.gen(function* () {
  yield* Effect.sleep("5 seconds")
  return "Finally done!"
})

// Timeout returning Option
const withTimeout = slowOperation.pipe(Effect.timeout("1 second"))
// Type: Effect<Option<string>, never, never>
// Returns None if timeout, Some(value) if completes

// Timeout with custom error
const withTimeoutError = slowOperation.pipe(
  Effect.timeoutFail({
    duration: "1 second",
    onTimeout: () => new Error("Operation timed out!"),
  })
)
// Type: Effect<string, Error, never>
// Fails with Error if timeout

// Timeout with fallback value
const withTimeoutFallback = slowOperation.pipe(
  Effect.timeoutTo({
    duration: "1 second",
    onSuccess: (result) => result,
    onTimeout: () => "Used fallback value",
  })
)
// Type: Effect<string, never, never>
// Returns fallback if timeout

// ─────────────────────────────────────────────────────────────────────────────
// 6b. Uninterruptible regions
// ─────────────────────────────────────────────────────────────────────────────

// Critical operations that shouldn't be interrupted
const criticalTransaction = Effect.gen(function* () {
  yield* Effect.logInfo("Starting critical transaction...")
  yield* Effect.sleep("500 millis")
  yield* Effect.logInfo("Committing...")
  yield* Effect.sleep("500 millis")
  yield* Effect.logInfo("Done!")
}).pipe(Effect.uninterruptible)
//      ^^^^^^^^^^^^^^^^^^^^^^
//      This effect can't be cancelled mid-way

// =============================================================================
// SECTION 7: STREAMS (Brief Introduction)
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      WHEN TO USE Stream vs Effect                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  USE Effect WHEN:                                                         ║
 * ║  ─────────────────                                                        ║
 * ║  - You need ONE result (single value, single response)                    ║
 * ║  - API call that returns JSON                                             ║
 * ║  - Database query returning rows                                          ║
 * ║  - File read (whole file at once)                                         ║
 * ║                                                                           ║
 * ║  USE Stream WHEN:                                                         ║
 * ║  ────────────────                                                         ║
 * ║  - You need MANY values over time                                         ║
 * ║  - Reading a large file line by line                                      ║
 * ║  - WebSocket messages                                                     ║
 * ║  - Paginated API (fetching page by page)                                  ║
 * ║  - Event processing                                                       ║
 * ║  - Processing data larger than memory                                     ║
 * ║                                                                           ║
 * ║  ANALOGY:                                                                 ║
 * ║  - Effect = ordering one dish at a restaurant                             ║
 * ║  - Stream = a conveyor belt sushi restaurant                              ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 7a. Basic Stream examples
// ─────────────────────────────────────────────────────────────────────────────

// Stream from values
const numberStream = Stream.make(1, 2, 3, 4, 5)
// Type: Stream<number, never, never>

// Stream from array
const arrayStream = Stream.fromIterable([1, 2, 3, 4, 5])

// Transform stream
const doubledStream = numberStream.pipe(Stream.map((n) => n * 2))
// Emits: 2, 4, 6, 8, 10

// Filter stream
const evenStream = numberStream.pipe(Stream.filter((n) => n % 2 === 0))
// Emits: 2, 4

// Convert Stream to Effect (collect all values)
const collectAll = numberStream.pipe(Stream.runCollect)
// Type: Effect<Chunk<number>, never, never>

// Convert Stream to Effect (run for side effects)
const runForEach = numberStream.pipe(Stream.runForEach((n) => Console.log(`Got: ${n}`)))
// Type: Effect<void, never, never>

// ─────────────────────────────────────────────────────────────────────────────
// 7b. Practical Stream use case: Paginated API
// ─────────────────────────────────────────────────────────────────────────────

// Simulate paginated API
const fetchPage = (page: number) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Fetching page ${page}...`)
    if (page > 3) return { items: [], hasMore: false }
    return {
      items: [`item-${page}-1`, `item-${page}-2`],
      hasMore: true,
    }
  })

// Stream that fetches all pages automatically
const allItems = Stream.paginateEffect(1, (page) =>
  fetchPage(page).pipe(
    Effect.map((response) => [
      response.items,
      response.hasMore ? Option.some(page + 1) : Option.none(),
    ])
  )
).pipe(Stream.flattenIterables)
// Emits: "item-1-1", "item-1-2", "item-2-1", "item-2-2", "item-3-1", "item-3-2"

// =============================================================================
// SECTION 8: COMMON REAL-WORLD PATTERNS
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// 8a. Circuit Breaker Pattern
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Circuit breaker prevents calling a failing service repeatedly.
 * After N failures, it "opens" and fails fast for a cooldown period.
 */

const circuitBreaker = (maxFailures: number, cooldownMs: number) => {
  return Effect.gen(function* () {
    const failures = yield* Ref.make(0)
    const lastFailure = yield* Ref.make<number | null>(null)

    return <A, E>(effect: Effect.Effect<A, E>) =>
      Effect.gen(function* () {
        const failureCount = yield* Ref.get(failures)
        const lastFail = yield* Ref.get(lastFailure)
        const now = Date.now()

        // Check if circuit is open
        if (failureCount >= maxFailures && lastFail && now - lastFail < cooldownMs) {
          return yield* Effect.fail("Circuit breaker is open" as const)
        }

        // Try the effect
        const result = yield* effect.pipe(
          Effect.tapError(() =>
            Effect.gen(function* () {
              yield* Ref.update(failures, (n) => n + 1)
              yield* Ref.set(lastFailure, Date.now())
            })
          ),
          Effect.tap(() => Ref.set(failures, 0)) // Reset on success
        )

        return result
      })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 8b. Rate Limiter Pattern
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Limit how many operations can happen per time window.
 */

const rateLimiter = (maxRequests: number, windowMs: number) =>
  Effect.gen(function* () {
    const requests = yield* Ref.make<number[]>([])

    return <A, E, R>(effect: Effect.Effect<A, E, R>) =>
      Effect.gen(function* () {
        const now = Date.now()

        // Clean old requests and check count
        yield* Ref.update(requests, (reqs) => reqs.filter((t) => now - t < windowMs))

        const currentCount = yield* Ref.get(requests).pipe(Effect.map((r) => r.length))

        if (currentCount >= maxRequests) {
          return yield* Effect.fail("Rate limit exceeded" as const)
        }

        // Record this request and execute
        yield* Ref.update(requests, (reqs) => [...reqs, now])
        return yield* effect
      })
  })

// ─────────────────────────────────────────────────────────────────────────────
// 8c. Graceful Shutdown Pattern
// ─────────────────────────────────────────────────────────────────────────────

const gracefulShutdown = Effect.gen(function* () {
  const shutdownSignal = yield* Ref.make(false)

  // Main work loop
  const workLoop = Effect.gen(function* () {
    while (!(yield* Ref.get(shutdownSignal))) {
      yield* Effect.logInfo("Doing work...")
      yield* Effect.sleep("1 second")
    }
    yield* Effect.logInfo("Shutdown signal received, cleaning up...")
  })

  // Shutdown trigger (would be connected to SIGTERM in real app)
  const triggerShutdown = Effect.gen(function* () {
    yield* Effect.sleep("5 seconds")
    yield* Effect.logInfo("Triggering shutdown...")
    yield* Ref.set(shutdownSignal, true)
  })

  // Run both concurrently
  yield* Effect.all([workLoop, triggerShutdown], { concurrency: "unbounded" })
})

// =============================================================================
// SECTION 9: ANTI-PATTERNS - What NOT to Do
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         COMMON MISTAKES TO AVOID                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// ❌ DON'T: Use mutable variables instead of Ref
// ─────────────────────────────────────────────────────────────────────────────

// WRONG - Not concurrent-safe:
// let counter = 0
// const increment = Effect.sync(() => counter++)

// CORRECT - Concurrent-safe:
// const counter = Ref.make(0)
// const increment = Ref.update(counter, n => n + 1)

// ─────────────────────────────────────────────────────────────────────────────
// ❌ DON'T: Forget to use Effect.scoped with resources
// ─────────────────────────────────────────────────────────────────────────────

// WRONG - Resource never released:
// const wrong = Effect.gen(function* () {
//   const conn = yield* dbConnection  // This needs a Scope!
//   return yield* conn.query("SELECT 1")
// })

// CORRECT - Scope manages resource lifetime:
// const correct = Effect.gen(function* () {
//   const conn = yield* dbConnection
//   return yield* conn.query("SELECT 1")
// }).pipe(Effect.scoped)

// ─────────────────────────────────────────────────────────────────────────────
// ❌ DON'T: Use unbounded concurrency without thinking
// ─────────────────────────────────────────────────────────────────────────────

// WRONG - Could overwhelm the API:
// const wrong = Effect.all(
//   thousandsOfRequests,
//   { concurrency: "unbounded" }
// )

// CORRECT - Limit concurrency:
// const correct = Effect.all(
//   thousandsOfRequests,
//   { concurrency: 10 }
// )

// ─────────────────────────────────────────────────────────────────────────────
// ❌ DON'T: Forget error handling in concurrent effects
// ─────────────────────────────────────────────────────────────────────────────

// By default, Effect.all fails fast - if one fails, all are interrupted
// This might not be what you want!

// CORRECT - Collect all results including failures:
const allSettled = <A, E>(effects: Effect.Effect<A, E>[]) =>
  Effect.all(effects.map((e) => e.pipe(Effect.either)), { concurrency: "unbounded" })
// Returns array of Either<A, E> - you can see which succeeded/failed

// ─────────────────────────────────────────────────────────────────────────────
// ❌ DON'T: Create infinite schedules without exit conditions
// ─────────────────────────────────────────────────────────────────────────────

// WRONG - Will retry forever:
// const wrong = effect.pipe(Effect.retry(Schedule.forever))

// CORRECT - Add a limit:
// const correct = effect.pipe(
//   Effect.retry(Schedule.forever.pipe(Schedule.compose(Schedule.recurs(100))))
// )

// =============================================================================
// EXPORTS & CHEAT SHEET
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                          ADVANCED PATTERNS CHEAT SHEET                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  CONCURRENCY:                                                             ║
 * ║    Effect.all([...])                       Sequential                     ║
 * ║    Effect.all([...], {concurrency: N})     Limited parallel               ║
 * ║    Effect.all([...], {concurrency: "unbounded"})  Full parallel           ║
 * ║    Effect.race(a, b)                       First wins                     ║
 * ║    Effect.fork(effect)                     Background task                ║
 * ║                                                                           ║
 * ║  RESOURCES:                                                               ║
 * ║    Effect.acquireRelease(acquire, release) Safe resource                  ║
 * ║    effect.pipe(Effect.scoped)              Manage scope                   ║
 * ║    effect.pipe(Effect.ensuring(cleanup))   Cleanup after                  ║
 * ║                                                                           ║
 * ║  STATE:                                                                   ║
 * ║    Ref.make(value)                         Create ref                     ║
 * ║    Ref.get(ref)                            Read                           ║
 * ║    Ref.set(ref, value)                     Write                          ║
 * ║    Ref.update(ref, fn)                     Transform                      ║
 * ║                                                                           ║
 * ║  SCHEDULING:                                                              ║
 * ║    Effect.retry(Schedule.recurs(n))        Retry n times                  ║
 * ║    Effect.retry(Schedule.exponential(d))   Exponential backoff            ║
 * ║    Effect.repeat(Schedule.spaced(d))       Poll every d                   ║
 * ║                                                                           ║
 * ║  TIMEOUTS:                                                                ║
 * ║    Effect.timeout(duration)                Returns Option                 ║
 * ║    Effect.timeoutFail({...})               Fails on timeout               ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export {
  // Section 1: Gen vs Pipe
  processUserGen,
  processUserPipe,
  mixedStyle,

  // Section 2: Concurrency
  sequential,
  limitedConcurrency,
  unboundedConcurrency,
  fetchDashboardData,
  raceExample,
  withFork,
  interruptExample,

  // Section 3: Resources
  dbConnection,
  useDatabase,
  multiResource,
  withCleanup,

  // Section 4: State
  counterExample,
  statefulApp,
  modifyExample,
  concurrentCounter,

  // Section 5: Scheduling
  withRetry,
  withDelayedRetry,
  withExponentialBackoff,
  productionRetryStrategy,
  polling,

  // Section 6: Interruption
  withTimeout,
  withTimeoutError,
  withTimeoutFallback,
  criticalTransaction,

  // Section 7: Streams
  numberStream,
  allItems,

  // Section 8: Patterns
  circuitBreaker,
  rateLimiter,
  gracefulShutdown,

  // Section 9: Anti-patterns
  allSettled,
}
