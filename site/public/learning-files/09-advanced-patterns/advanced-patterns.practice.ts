/**
 * =============================================================================
 * ADVANCED EFFECT PATTERNS - PRACTICE EXERCISES
 * =============================================================================
 *
 * Prerequisites: Read 09-advanced-patterns.reference.ts first!
 *
 * Complete these exercises to practice advanced Effect patterns.
 * Uncomment and implement each function.
 *
 * Run with: bun run 09-advanced-patterns/advanced-patterns.practice.ts
 * Typecheck: bun run typecheck
 *
 * =============================================================================
 */

import { Console, Effect, Fiber, Option, Ref, Schedule, Stream } from "effect"

// =============================================================================
// EXERCISE 1: Concurrency
// =============================================================================

/**
 * Exercise 1a: Fetch Multiple Users in Parallel
 *
 * Given a list of user IDs, fetch all users in parallel with a maximum
 * concurrency of 3.
 *
 * HINT: Use Effect.all with concurrency option
 */

const fetchUserById = (id: number) =>
  Effect.gen(function* () {
    yield* Effect.sleep("100 millis") // Simulate API call
    return { id, name: `User ${id}`, email: `user${id}@example.com` }
  })

// TODO: Implement this function
// const fetchUsersParallel = (ids: number[]) =>
//   Effect.all(
//     ???,
//     { concurrency: ??? }
//   )

// Uncomment to test:
// const testEx1a = Effect.gen(function* () {
//   const users = yield* fetchUsersParallel([1, 2, 3, 4, 5, 6])
//   yield* Console.log(`Fetched ${users.length} users`)
//   return users
// })

/**
 * Exercise 1b: Race with Timeout Fallback
 *
 * Create a function that races a slow API call against a timeout.
 * If the API is too slow, return a fallback value instead.
 *
 * HINT: Use Effect.race or Effect.timeoutTo
 */

const slowApiCall = Effect.gen(function* () {
  yield* Effect.sleep("2 seconds")
  return { data: "Real data from API" }
})

// TODO: Implement - should return fallback if API takes > 500ms
// const fetchWithFallback = slowApiCall.pipe(
//   Effect.timeoutTo({
//     duration: ???,
//     onSuccess: ???,
//     onTimeout: ???
//   })
// )

/**
 * Exercise 1c: Fork and Join
 *
 * Start a background task, do some other work, then wait for the background
 * task to complete.
 */

const backgroundProcess = Effect.gen(function* () {
  yield* Effect.logInfo("Background: Starting...")
  yield* Effect.sleep("300 millis")
  yield* Effect.logInfo("Background: Done!")
  return "Background result"
})

// TODO: Implement
// const forkAndJoinExample = Effect.gen(function* () {
//   // 1. Fork backgroundProcess
//   const fiber = yield* ???
//
//   // 2. Do some "main work" (just log and sleep 100ms)
//   yield* Effect.logInfo("Main: Doing other work...")
//   yield* Effect.sleep("100 millis")
//
//   // 3. Wait for the background task
//   const result = yield* ???
//
//   yield* Effect.logInfo(`Main: Got background result: ${result}`)
//   return result
// })

// =============================================================================
// EXERCISE 2: Resource Management
// =============================================================================

/**
 * Exercise 2a: Create a Safe Resource
 *
 * Create a "database connection" resource that logs when it opens and closes.
 * The connection should ALWAYS be closed, even if an error occurs.
 *
 * HINT: Use Effect.acquireRelease
 */

interface Connection {
  id: string
  query: (sql: string) => Effect.Effect<string[], never, never>
}

// TODO: Implement
// const makeConnection = Effect.acquireRelease(
//   // Acquire: create and return a Connection
//   Effect.gen(function* () {
//     const id = `conn-${Date.now()}`
//     yield* Effect.logInfo(`Opening connection ${id}`)
//     return {
//       id,
//       query: (sql: string) => Effect.succeed([`Result for: ${sql}`])
//     } satisfies Connection
//   }),
//   // Release: close the connection
//   (conn) => ???
// )

// TODO: Use the connection with Effect.scoped
// const useConnection = Effect.gen(function* () {
//   const conn = yield* makeConnection
//   const users = yield* conn.query("SELECT * FROM users")
//   yield* Effect.logInfo(`Got ${users.length} results`)
//   return users
// }).pipe(???)

/**
 * Exercise 2b: Multiple Resources
 *
 * Open two files, read from both, and ensure both are closed.
 * Files should be closed in reverse order of opening.
 */

const openFile = (name: string) =>
  Effect.acquireRelease(
    Effect.gen(function* () {
      yield* Effect.logInfo(`Opening file: ${name}`)
      return {
        name,
        read: () => Effect.succeed(`Contents of ${name}`),
      }
    }),
    (file) => Effect.logInfo(`Closing file: ${file.name}`)
  )

// TODO: Implement - open "config.json" and "data.json", read both, return contents
// const readTwoFiles = Effect.gen(function* () {
//   const config = yield* openFile("config.json")
//   const data = yield* ???
//
//   const configContents = yield* config.read()
//   const dataContents = yield* ???
//
//   return { configContents, dataContents }
// }).pipe(???)

// =============================================================================
// EXERCISE 3: State Management with Ref
// =============================================================================

/**
 * Exercise 3a: Simple Counter
 *
 * Create a counter that can be incremented and read.
 */

// TODO: Implement
// const counterProgram = Effect.gen(function* () {
//   // 1. Create a Ref starting at 0
//   const counter = yield* Ref.make(???)
//
//   // 2. Increment it 5 times
//   for (let i = 0; i < 5; i++) {
//     yield* Ref.update(counter, ???)
//   }
//
//   // 3. Read and return the final value
//   const final = yield* ???
//   yield* Console.log(`Final count: ${final}`)
//   return final
// })

/**
 * Exercise 3b: Shopping Cart State
 *
 * Implement a shopping cart using Ref that supports:
 * - Adding items
 * - Removing items
 * - Getting total
 */

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

// TODO: Implement
// const shoppingCartProgram = Effect.gen(function* () {
//   // Create cart state
//   const cart = yield* Ref.make<CartItem[]>([])
//
//   // Add item helper
//   const addItem = (item: CartItem) =>
//     Ref.update(cart, (items) => [...items, item])
//
//   // Remove item helper
//   const removeItem = (id: string) =>
//     Ref.update(cart, (items) => items.filter(i => i.id !== id))
//
//   // Get total helper
//   const getTotal = Ref.get(cart).pipe(
//     Effect.map(items => items.reduce((sum, i) => sum + i.price * i.quantity, 0))
//   )
//
//   // Test it out:
//   yield* addItem({ id: "1", name: "Widget", price: 10, quantity: 2 })
//   yield* addItem({ id: "2", name: "Gadget", price: 25, quantity: 1 })
//   yield* Console.log(`Total after adding: $${yield* getTotal}`)
//
//   yield* removeItem("1")
//   yield* Console.log(`Total after removing Widget: $${yield* getTotal}`)
//
//   return yield* Ref.get(cart)
// })

/**
 * Exercise 3c: Concurrent-Safe Counter
 *
 * Demonstrate that Ref is safe for concurrent updates.
 * Run 100 concurrent increments and verify the final count is exactly 100.
 */

// TODO: Implement
// const concurrentCounterProgram = Effect.gen(function* () {
//   const counter = yield* Ref.make(0)
//
//   // Run 100 increments concurrently
//   yield* Effect.all(
//     Array.from({ length: 100 }, () =>
//       Ref.update(counter, n => n + 1)
//     ),
//     { concurrency: ??? }
//   )
//
//   const final = yield* Ref.get(counter)
//   yield* Console.log(`Final count (should be 100): ${final}`)
//
//   // Verify
//   if (final !== 100) {
//     return yield* Effect.fail("Race condition detected!")
//   }
//   return final
// })

// =============================================================================
// EXERCISE 4: Scheduling
// =============================================================================

/**
 * Exercise 4a: Retry with Exponential Backoff
 *
 * Create a flaky operation that fails 3 times then succeeds.
 * Retry it with exponential backoff starting at 50ms.
 */

let attempt = 0
const flakyOperation = Effect.gen(function* () {
  attempt++
  yield* Effect.logInfo(`Attempt ${attempt}...`)
  if (attempt < 4) {
    return yield* Effect.fail(`Failed on attempt ${attempt}` as const)
  }
  return "Success!"
})

// TODO: Implement
// const withRetryBackoff = flakyOperation.pipe(
//   Effect.retry(
//     Schedule.exponential("50 millis").pipe(
//       Schedule.compose(Schedule.recurs(???))
//     )
//   )
// )

/**
 * Exercise 4b: Polling
 *
 * Create a polling function that checks a status every 200ms
 * until it returns "ready" (max 10 attempts).
 */

let pollCount = 0
const checkStatus = Effect.gen(function* () {
  pollCount++
  yield* Effect.logInfo(`Polling... (${pollCount})`)
  if (pollCount >= 5) {
    return "ready" as const
  }
  return "pending" as const
})

// TODO: Implement - poll until status is "ready"
// HINT: Use Effect.repeat with Schedule.recurWhile or use Effect.gen with a loop

// =============================================================================
// EXERCISE 5: Streams (Bonus)
// =============================================================================

/**
 * Exercise 5a: Basic Stream Operations
 *
 * Create a stream of numbers 1-10, double each, filter for even results,
 * and collect into an array.
 */

// TODO: Implement
// const streamPipeline = Stream.range(1, 10).pipe(
//   Stream.map(n => ???),        // Double each number
//   Stream.filter(n => ???),     // Keep only even numbers
//   Stream.runCollect            // Collect to Chunk
// )

/**
 * Exercise 5b: Paginated API Stream
 *
 * Create a stream that fetches pages from an API until there are no more pages.
 */

const fetchPage = (page: number) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Fetching page ${page}...`)
    if (page > 3) {
      return { items: [] as string[], hasMore: false }
    }
    return {
      items: [`item-${page}-a`, `item-${page}-b`],
      hasMore: true,
    }
  })

// TODO: Implement using Stream.paginateEffect
// HINT: See the reference file for an example

// =============================================================================
// SOLUTIONS (Don't peek until you've tried!)
// =============================================================================

// Scroll down for solutions...
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

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION 1a: Fetch Users in Parallel
// ─────────────────────────────────────────────────────────────────────────────

const fetchUsersParallel_SOLUTION = (ids: number[]) =>
  Effect.all(
    ids.map((id) => fetchUserById(id)),
    { concurrency: 3 }
  )

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION 1b: Race with Timeout Fallback
// ─────────────────────────────────────────────────────────────────────────────

const fetchWithFallback_SOLUTION = slowApiCall.pipe(
  Effect.timeoutTo({
    duration: "500 millis",
    onSuccess: (result) => result,
    onTimeout: () => ({ data: "Fallback data (API was too slow)" }),
  })
)

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION 1c: Fork and Join
// ─────────────────────────────────────────────────────────────────────────────

const forkAndJoinExample_SOLUTION = Effect.gen(function* () {
  const fiber = yield* Effect.fork(backgroundProcess)

  yield* Effect.logInfo("Main: Doing other work...")
  yield* Effect.sleep("100 millis")

  const result = yield* Fiber.join(fiber)

  yield* Effect.logInfo(`Main: Got background result: ${result}`)
  return result
})

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION 2a: Safe Resource
// ─────────────────────────────────────────────────────────────────────────────

const makeConnection_SOLUTION = Effect.acquireRelease(
  Effect.gen(function* () {
    const id = `conn-${Date.now()}`
    yield* Effect.logInfo(`Opening connection ${id}`)
    return {
      id,
      query: (sql: string) => Effect.succeed([`Result for: ${sql}`]),
    } satisfies Connection
  }),
  (conn) => Effect.logInfo(`Closing connection ${conn.id}`)
)

const useConnection_SOLUTION = Effect.gen(function* () {
  const conn = yield* makeConnection_SOLUTION
  const users = yield* conn.query("SELECT * FROM users")
  yield* Effect.logInfo(`Got ${users.length} results`)
  return users
}).pipe(Effect.scoped)

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION 2b: Multiple Resources
// ─────────────────────────────────────────────────────────────────────────────

const readTwoFiles_SOLUTION = Effect.gen(function* () {
  const config = yield* openFile("config.json")
  const data = yield* openFile("data.json")

  const configContents = yield* config.read()
  const dataContents = yield* data.read()

  return { configContents, dataContents }
}).pipe(Effect.scoped)

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION 3a: Simple Counter
// ─────────────────────────────────────────────────────────────────────────────

const counterProgram_SOLUTION = Effect.gen(function* () {
  const counter = yield* Ref.make(0)

  for (let i = 0; i < 5; i++) {
    yield* Ref.update(counter, (n) => n + 1)
  }

  const final = yield* Ref.get(counter)
  yield* Console.log(`Final count: ${final}`)
  return final
})

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION 3c: Concurrent-Safe Counter
// ─────────────────────────────────────────────────────────────────────────────

const concurrentCounterProgram_SOLUTION = Effect.gen(function* () {
  const counter = yield* Ref.make(0)

  yield* Effect.all(
    Array.from({ length: 100 }, () => Ref.update(counter, (n) => n + 1)),
    { concurrency: "unbounded" }
  )

  const final = yield* Ref.get(counter)
  yield* Console.log(`Final count (should be 100): ${final}`)

  if (final !== 100) {
    return yield* Effect.fail("Race condition detected!")
  }
  return final
})

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION 4a: Retry with Exponential Backoff
// ─────────────────────────────────────────────────────────────────────────────

const withRetryBackoff_SOLUTION = flakyOperation.pipe(
  Effect.retry(Schedule.exponential("50 millis").pipe(Schedule.compose(Schedule.recurs(5))))
)

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION 5a: Stream Pipeline
// ─────────────────────────────────────────────────────────────────────────────

const streamPipeline_SOLUTION = Stream.range(1, 11).pipe(
  // range is exclusive of end
  Stream.map((n) => n * 2),
  Stream.filter((n) => n % 4 === 0), // Doubled evens are divisible by 4
  Stream.runCollect
)

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION 5b: Paginated Stream
// ─────────────────────────────────────────────────────────────────────────────

const paginatedStream_SOLUTION = Stream.paginateEffect(1, (page) =>
  fetchPage(page).pipe(
    Effect.map((response) => [response.items, response.hasMore ? Option.some(page + 1) : Option.none()])
  )
).pipe(Stream.flattenIterables)

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Exercise helpers
  fetchUserById,
  slowApiCall,
  backgroundProcess,
  openFile,
  flakyOperation,
  checkStatus,
  fetchPage,

  // Solutions
  fetchUsersParallel_SOLUTION,
  fetchWithFallback_SOLUTION,
  forkAndJoinExample_SOLUTION,
  makeConnection_SOLUTION,
  useConnection_SOLUTION,
  readTwoFiles_SOLUTION,
  counterProgram_SOLUTION,
  concurrentCounterProgram_SOLUTION,
  withRetryBackoff_SOLUTION,
  streamPipeline_SOLUTION,
  paginatedStream_SOLUTION,
}

// =============================================================================
// MAIN - Uncomment to run solutions
// =============================================================================

// const main = Effect.gen(function* () {
//   yield* Console.log("=== Running Advanced Pattern Solutions ===\n")
//
//   yield* Console.log("--- Solution 1a: Parallel Fetch ---")
//   const users = yield* fetchUsersParallel_SOLUTION([1, 2, 3, 4, 5])
//   yield* Console.log(`Got ${users.length} users\n`)
//
//   yield* Console.log("--- Solution 2a: Safe Resource ---")
//   yield* useConnection_SOLUTION
//
//   yield* Console.log("\n--- Solution 3a: Counter ---")
//   yield* counterProgram_SOLUTION
//
//   yield* Console.log("\n--- Solution 3c: Concurrent Counter ---")
//   yield* concurrentCounterProgram_SOLUTION
// })

// Effect.runPromise(main).catch(console.error)
