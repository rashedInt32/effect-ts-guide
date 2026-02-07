/**
 * =============================================================================
 * EFFECT BASICS - REFERENCE
 * =============================================================================
 *
 * Prerequisites: Read 00-mental-models first!
 *
 * This module covers the PRACTICAL patterns for writing Effect code.
 * The mental models taught you WHEN to use things - this teaches HOW.
 *
 * TABLE OF CONTENTS:
 *   1. Creating Effects - All the ways to create Effects
 *   2. Effect.gen - The async/await of Effect (MOST IMPORTANT)
 *   3. Effect.fn - Named functions with tracing
 *   4. Pipe - Composing transformations
 *   5. map vs flatMap vs tap - COMPREHENSIVE comparison
 *   6. Running Effects - How to execute at the edge
 *   7. Combining Effects - all, forEach, zip
 *   8. Common Patterns - delay, timeout, retry
 *   9. Complete Example - Putting it all together
 *   10. Anti-Patterns - What NOT to do
 *
 * REAL EXAMPLE: api/src/migrate.ts
 * DOCS: https://effect.website/docs/getting-started/introduction
 *
 * =============================================================================
 */

import { Console, Effect, pipe, Schedule } from "effect"

// =============================================================================
// SECTION 1: CREATING EFFECTS - All the Ways
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     CREATING EFFECTS: QUICK REFERENCE                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  HAVE A VALUE?                                                            ║
 * ║    Effect.succeed(value)     ──→ Effect<A, never, never>                  ║
 * ║    Effect.fail(error)        ──→ Effect<never, E, never>                  ║
 * ║                                                                           ║
 * ║  HAVE A SYNC FUNCTION?                                                    ║
 * ║    Effect.sync(() => value)  ──→ Won't throw                              ║
 * ║    Effect.try(() => value)   ──→ Might throw                              ║
 * ║                                                                           ║
 * ║  HAVE A PROMISE?                                                          ║
 * ║    Effect.tryPromise({...})  ──→ Might reject (USE THIS!)                 ║
 * ║    Effect.promise(() => p)   ──→ Never rejects (rare)                     ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1a. Effect.succeed / Effect.fail - Immediate values
// ─────────────────────────────────────────────────────────────────────────────

// For values you already have - "lift" them into Effect
const succeeded = Effect.succeed(42)
// Type: Effect<number, never, never>
//       ^^^^^^^^      ^^^^^  ^^^^^
//       Success       Error  Requirements
//       (has value)   (can't fail) (no deps)

const failed = Effect.fail("Something went wrong")
// Type: Effect<never, string, never>
//       ^^^^^  ^^^^^^
//       No success value, has error

// PROMISE EQUIVALENT:
//   Promise.resolve(42)  →  Effect.succeed(42)
//   Promise.reject(err)  →  Effect.fail(err)

// ─────────────────────────────────────────────────────────────────────────────
// 1b. Effect.sync - Sync computation that WON'T throw
// ─────────────────────────────────────────────────────────────────────────────

// Use for pure computations or safe side effects
const synced = Effect.sync(() => {
  console.log("Side effect!") // Safe - console.log won't throw
  return Date.now() // Safe - always returns a number
})
// Type: Effect<number, never, never>

// WHEN TO USE:
// ✅ Logging, timing, reading from memory
// ✅ Pure calculations that can't fail
// ❌ JSON.parse - can throw!
// ❌ Anything that accesses network, files, etc.

// ─────────────────────────────────────────────────────────────────────────────
// 1c. Effect.try - Sync computation that MIGHT throw
// ─────────────────────────────────────────────────────────────────────────────

// Use when the function might throw an exception
const tried = Effect.try(() => {
  const data = JSON.parse('{"name": "Alice"}')
  return data as { name: string }
})
// Type: Effect<{ name: string }, UnknownException, never>

// With custom error type:
const triedWithError = Effect.try({
  try: () => JSON.parse("invalid json"),
  catch: (error) => new Error(`JSON parse failed: ${error}`),
})
// Type: Effect<unknown, Error, never>

// ─────────────────────────────────────────────────────────────────────────────
// 1d. Effect.tryPromise - Async that MIGHT reject (MOST COMMON)
// ─────────────────────────────────────────────────────────────────────────────

// USE THIS for all async operations!
const fetched = Effect.tryPromise({
  try: () => fetch("https://api.example.com/data").then((r) => r.json()),
  catch: (error) => new Error(`Fetch failed: ${error}`),
})
// Type: Effect<unknown, Error, never>

// PROMISE EQUIVALENT:
// async function fetchData() {
//   try {
//     return await fetch(url).then(r => r.json())
//   } catch (error) {
//     throw new Error(`Fetch failed: ${error}`)
//   }
// }

// ─────────────────────────────────────────────────────────────────────────────
// 1e. Effect.promise - Async that NEVER rejects (rare)
// ─────────────────────────────────────────────────────────────────────────────

// Only use when you're CERTAIN the promise won't reject
const promiseBased = Effect.promise(() => Promise.resolve("done"))
// Type: Effect<string, never, never>

// In practice, prefer tryPromise. It's safer.

// =============================================================================
// SECTION 2: Effect.gen - The MOST IMPORTANT Pattern
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      Effect.gen = async/await for Effect                   ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  If you know async/await, you know Effect.gen!                            ║
 * ║                                                                           ║
 * ║  ASYNC/AWAIT                      EFFECT.GEN                              ║
 * ║  ───────────                      ──────────                              ║
 * ║  async function() {...}     →     Effect.gen(function* () {...})          ║
 * ║  await promise              →     yield* effect                           ║
 * ║  return value               →     return value                            ║
 * ║  throw error                →     yield* Effect.fail(error)               ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 2a. Basic Effect.gen
// ─────────────────────────────────────────────────────────────────────────────

// PROMISE VERSION:
async function addNumbersAsync(): Promise<number> {
  const a = await Promise.resolve(10)
  const b = await Promise.resolve(20)
  return a + b
}

// EFFECT VERSION:
const basicGen = Effect.gen(function* () {
  const a = yield* Effect.succeed(10) // yield* = await
  const b = yield* Effect.succeed(20)
  return a + b
})
// Type: Effect<number, never, never>

// ─────────────────────────────────────────────────────────────────────────────
// 2b. Effect.gen with logging
// ─────────────────────────────────────────────────────────────────────────────

// Effect has built-in logging - use it instead of console.log
const withLogging = Effect.gen(function* () {
  yield* Effect.logInfo("Starting computation...")
  const result = yield* Effect.succeed(42)
  yield* Effect.logInfo(`Got result: ${result}`)
  return result
})

// LOGGING LEVELS:
// Effect.logDebug("...")   - Debug info
// Effect.logInfo("...")    - Normal info
// Effect.logWarning("...") - Warnings
// Effect.logError("...")   - Errors

// ─────────────────────────────────────────────────────────────────────────────
// 2c. Effect.gen with errors (early return)
// ─────────────────────────────────────────────────────────────────────────────

// PROMISE VERSION:
async function validateAge(age: number): Promise<string> {
  if (age < 0) {
    throw new Error("Age cannot be negative")
  }
  if (age < 18) {
    return "minor"
  }
  return "adult"
}

// EFFECT VERSION:
const validateAgeEffect = (age: number) =>
  Effect.gen(function* () {
    if (age < 0) {
      // yield* Effect.fail = throw
      return yield* Effect.fail("Age cannot be negative" as const)
    }
    if (age < 18) {
      return "minor" as const
    }
    return "adult" as const
  })
// Type: Effect<"minor" | "adult", "Age cannot be negative", never>

// ─────────────────────────────────────────────────────────────────────────────
// 2d. Effect.gen with if/else and loops
// ─────────────────────────────────────────────────────────────────────────────

// Regular control flow works inside Effect.gen!
const withConditional = Effect.gen(function* () {
  const value = yield* Effect.succeed(Math.random())

  if (value > 0.5) {
    yield* Effect.logInfo("High value!")
    return "high"
  } else {
    yield* Effect.logInfo("Low value!")
    return "low"
  }
})

const withLoop = Effect.gen(function* () {
  let sum = 0

  for (let i = 1; i <= 5; i++) {
    yield* Effect.logInfo(`Adding ${i}`)
    sum += i
  }

  return sum // 15
})

// =============================================================================
// SECTION 3: Effect.fn - Named, Traced Functions
// =============================================================================

/**
 * Effect.fn("name")(function* (args) { ... })
 *
 * Creates a named function that:
 * 1. Returns an Effect
 * 2. Has a name for debugging/tracing
 * 3. Shows up in stack traces with that name
 *
 * USE THIS for any reusable effectful function!
 */

// ─────────────────────────────────────────────────────────────────────────────
// 3a. Basic Effect.fn
// ─────────────────────────────────────────────────────────────────────────────

const processUser = Effect.fn("processUser")(function* (userId: string) {
  yield* Effect.logInfo(`Processing user: ${userId}`)
  const user = { id: userId, name: "Alice" }
  return user
})
// Type: (userId: string) => Effect<{ id: string; name: string }, never, never>

// Call it like a regular function, but it returns an Effect:
const useProcessUser = Effect.gen(function* () {
  const user = yield* processUser("user-123")
  return user
})

// ─────────────────────────────────────────────────────────────────────────────
// 3b. Effect.fn with errors
// ─────────────────────────────────────────────────────────────────────────────

const divideNumbers = Effect.fn("divideNumbers")(function* (
  a: number,
  b: number
) {
  if (b === 0) {
    return yield* Effect.fail("Division by zero" as const)
  }
  return a / b
})
// Type: (a: number, b: number) => Effect<number, "Division by zero", never>

// ─────────────────────────────────────────────────────────────────────────────
// 3c. Why use Effect.fn instead of regular functions?
// ─────────────────────────────────────────────────────────────────────────────

// WITHOUT Effect.fn - works, but anonymous in traces:
const processUserAnonymous = (userId: string) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Processing user: ${userId}`)
    return { id: userId, name: "Alice" }
  })

// WITH Effect.fn - named in traces, easier debugging:
const processUserNamed = Effect.fn("processUser")(function* (userId: string) {
  yield* Effect.logInfo(`Processing user: ${userId}`)
  return { id: userId, name: "Alice" }
})

// In error traces, you'll see:
// ❌ at <anonymous>
// ✅ at processUser

// =============================================================================
// SECTION 4: pipe - Composing Transformations
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     TWO WAYS TO COMPOSE: pipe() vs .pipe()                 ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  FUNCTION STYLE:                                                          ║
 * ║    pipe(                                                                  ║
 * ║      Effect.succeed(10),                                                  ║
 * ║      Effect.map(n => n * 2),                                              ║
 * ║      Effect.map(n => n + 5)                                               ║
 * ║    )                                                                      ║
 * ║                                                                           ║
 * ║  METHOD STYLE (often cleaner):                                            ║
 * ║    Effect.succeed(10).pipe(                                               ║
 * ║      Effect.map(n => n * 2),                                              ║
 * ║      Effect.map(n => n + 5)                                               ║
 * ║    )                                                                      ║
 * ║                                                                           ║
 * ║  Both are equivalent! Use whichever reads better.                         ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Function style
const withPipe = pipe(
  Effect.succeed(10),
  Effect.map((n) => n * 2), // 20
  Effect.map((n) => n + 5), // 25
  Effect.map((n) => `Result: ${n}`) // "Result: 25"
)

// Method style (recommended - easier to read)
const withMethodPipe = Effect.succeed(10).pipe(
  Effect.map((n) => n * 2),
  Effect.map((n) => n + 5),
  Effect.map((n) => `Result: ${n}`)
)

// ─────────────────────────────────────────────────────────────────────────────
// 4b. Effect.gen vs pipe - WHEN TO USE WHICH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     Effect.gen vs pipe: DECISION GUIDE                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  USE Effect.gen WHEN:                                                     ║
 * ║  ────────────────────                                                     ║
 * ║  ✅ Complex control flow (if/else, loops, early returns)                  ║
 * ║  ✅ You need to use intermediate values multiple times                    ║
 * ║  ✅ Building business logic with many sequential steps                    ║
 * ║  ✅ Coming from async/await and want familiar syntax                      ║
 * ║  ✅ Easier to set breakpoints for debugging                               ║
 * ║                                                                           ║
 * ║  USE pipe WHEN:                                                           ║
 * ║  ───────────────                                                          ║
 * ║  ✅ Simple linear transformations (A → B → C)                             ║
 * ║  ✅ One-liners or short 2-3 step chains                                   ║
 * ║  ✅ Adding error handling/logging to existing effects                     ║
 * ║  ✅ Composing reusable pipelines                                          ║
 * ║  ✅ You want point-free functional style                                  ║
 * ║                                                                           ║
 * ║  RULE OF THUMB:                                                           ║
 * ║  "If you're thinking about variable names, use Effect.gen"                ║
 * ║  "If it's just transformations, use pipe"                                 ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// EXAMPLE: Same logic, two styles

// Using Effect.gen - Better for complex business logic
const validateAndProcessGen = (userId: string, amount: number) =>
  Effect.gen(function* () {
    // Each step has a name - easy to understand
    const user = yield* Effect.succeed({ id: userId, balance: 100 })

    // Complex conditionals are natural
    if (amount <= 0) {
      return yield* Effect.fail("Amount must be positive" as const)
    }

    if (amount > user.balance) {
      return yield* Effect.fail("Insufficient balance" as const)
    }

    // Can use intermediate values multiple times
    yield* Effect.logInfo(`Processing $${amount} for user ${user.id}`)
    const newBalance = user.balance - amount

    return { userId: user.id, newBalance, withdrawn: amount }
  })

// Using pipe - Better for linear transformations
const formatUserNamePipe = (name: string) =>
  Effect.succeed(name).pipe(
    Effect.map((n) => n.trim()),
    Effect.map((n) => n.toLowerCase()),
    Effect.map((n) => n.charAt(0).toUpperCase() + n.slice(1)),
    Effect.tap((formatted) => Effect.logDebug(`Formatted name: ${formatted}`))
  )

// MIXING IS FINE! Use gen for main logic, pipe for transformations
const mixedStyleExample = Effect.gen(function* () {
  const rawName = yield* Effect.succeed("  ALICE  ")

  // Use pipe for a quick transformation chain
  const formatted = yield* Effect.succeed(rawName).pipe(
    Effect.map((n) => n.trim()),
    Effect.map((n) => n.toLowerCase())
  )

  return `Hello, ${formatted}!`
})

// =============================================================================
// SECTION 5: map vs flatMap vs tap - COMPREHENSIVE COMPARISON
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              THE THREE TRANSFORMERS: map, flatMap, tap                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  If you read 00-mental-models, you know the decision tree:                ║
 * ║                                                                           ║
 * ║  ┌─────────────────────────────────────────────────────────────────────┐  ║
 * ║  │ Do I need to TRANSFORM the value?                                   │  ║
 * ║  │   NO  → Use tap (side effects only)                                 │  ║
 * ║  │   YES → Does MY FUNCTION return an Effect?                          │  ║
 * ║  │          NO  → Use map  (my function returns plain value)           │  ║
 * ║  │          YES → Use flatMap (my function returns Effect)             │  ║
 * ║  └─────────────────────────────────────────────────────────────────────┘  ║
 * ║                                                                           ║
 * ║  NOTE: All three operators return Effect! The question is what YOUR      ║
 * ║        callback function returns.                                        ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// We'll use this user throughout the examples
const user = Effect.succeed({ id: 1, name: "alice", email: "alice@example.com" })

// ─────────────────────────────────────────────────────────────────────────────
// 5a. Effect.map - YOUR FUNCTION returns a plain value
// ─────────────────────────────────────────────────────────────────────────────

/**
 * USE WHEN: Your callback returns a plain value (not an Effect)
 *
 * Your callback: (A) => B
 * map returns: Effect<B>  (map wraps your plain value in Effect)
 *
 * EQUIVALENT TO: promise.then(x => transformedValue)
 */

// ✅ CORRECT: Your function returns plain string, map wraps it
const withMap = user.pipe(
  Effect.map((u) => u.name.toUpperCase())
  //               ^^^^^^^^^^^^^^^^^^^^^^
  //               Your function returns string (plain value)
  //               map then returns Effect<string>
)
// Type: Effect<string, never, never>
// Value: "ALICE"

// More examples of when to use map:
const mapExamples = Effect.succeed({ price: 100, quantity: 3 }).pipe(
  Effect.map((order) => order.price * order.quantity), // Calculate total
  Effect.map((total) => total * 1.1), // Add tax
  Effect.map((finalPrice) => `$${finalPrice.toFixed(2)}`) // Format
)
// Type: Effect<string, never, never>
// Value: "$330.00"

// ─────────────────────────────────────────────────────────────────────────────
// 5b. Effect.flatMap - YOUR FUNCTION returns an Effect
// ─────────────────────────────────────────────────────────────────────────────

/**
 * USE WHEN: Your callback returns an Effect
 *
 * Your callback: (A) => Effect<B>
 * flatMap returns: Effect<B>  (flatMap flattens/unwraps it)
 *
 * EQUIVALENT TO: promise.then(x => anotherPromise)
 *
 * WHY "flatMap"? It "flattens" nested Effects:
 *   If you used map: Effect<Effect<A>> - nested, bad!
 *   flatMap flattens: Effect<A> - flat, good!
 */

// Helper function that returns an Effect
const fetchUserProfile = (userId: number) =>
  Effect.succeed({ userId, avatar: "avatar.png", bio: "Hello!" })

// ✅ CORRECT: Use flatMap because fetchUserProfile returns an Effect
const withFlatMap = user.pipe(
  Effect.flatMap((u) => fetchUserProfile(u.id))
  //                    ^^^^^^^^^^^^^^^^^^^^^
  //                    Returns Effect, not plain value
)
// Type: Effect<{ userId: number; avatar: string; bio: string }, never, never>

// CHAINING multiple Effects:
const saveUser = (u: { name: string }) => Effect.succeed({ saved: true, name: u.name })
const notifyAdmin = (name: string) => Effect.succeed({ notified: true, user: name })

const chainedEffects = user.pipe(
  Effect.flatMap((u) => saveUser(u)), // Returns Effect
  Effect.flatMap((result) => notifyAdmin(result.name)) // Returns Effect
)
// Each step depends on the previous Effect

// ─────────────────────────────────────────────────────────────────────────────
// 5c. Effect.tap - Side effect, DON'T change the value
// ─────────────────────────────────────────────────────────────────────────────

/**
 * USE WHEN: You want to DO something but keep the original value
 *
 * Common uses:
 * - Logging
 * - Metrics
 * - Notifications
 * - Audit trails
 *
 * The return value of tap is IGNORED - original value passes through
 */

const withTap = user.pipe(
  Effect.tap((u) => Effect.logInfo(`Processing: ${u.name}`)), // Log
  Effect.tap((u) => Console.log(`Email: ${u.email}`)), // Log (different way)
  Effect.map((u) => u.name.toUpperCase()) // Actually transform
)
// The user object passes through tap unchanged, then map transforms it

// ─────────────────────────────────────────────────────────────────────────────
// 5d. COMPARISON: Same Pipeline, Three Ways
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Let's process a user: log it, fetch their orders, calculate total
 */

const fetchOrders = (userId: number) =>
  Effect.succeed([
    { price: 10, quantity: 2 },
    { price: 25, quantity: 1 },
  ])

// Using pipe with all three:
const processUserPipeline = user.pipe(
  // TAP: Log (don't transform)
  Effect.tap((u) => Effect.logInfo(`Starting to process ${u.name}`)),

  // FLATMAP: Fetch orders (returns Effect)
  Effect.flatMap((u) =>
    fetchOrders(u.id).pipe(Effect.map((orders) => ({ user: u, orders })))
  ),

  // MAP: Calculate total (plain value)
  Effect.map(({ user: u, orders }) => ({
    name: u.name,
    total: orders.reduce((sum, o) => sum + o.price * o.quantity, 0),
  })),

  // TAP: Log result (don't transform)
  Effect.tap((result) => Effect.logInfo(`Total for ${result.name}: $${result.total}`))
)
// Type: Effect<{ name: string; total: number }, never, never>

// ─────────────────────────────────────────────────────────────────────────────
// 5e. COMMON MISTAKE: Using map when you should use flatMap
// ─────────────────────────────────────────────────────────────────────────────

// ❌ WRONG: map with a function that returns Effect
const wrongNested = user.pipe(
  Effect.map((u) => fetchUserProfile(u.id))
  //               ^^^^^^^^^^^^^^^^^^^^^^
  //               This returns Effect, so we get nested Effects!
)
// Type: Effect<Effect<{ userId: number; avatar: string; bio: string }, never, never>, never, never>
//       ^^^^^^ ^^^^^^
//       Effect<Effect<...>> = NESTED! BAD!

// ✅ CORRECT: flatMap flattens the nested Effect
const correctFlat = user.pipe(Effect.flatMap((u) => fetchUserProfile(u.id)))
// Type: Effect<{ userId: number; avatar: string; bio: string }, never, never>
//       Effect<...> = FLAT! GOOD!

// ─────────────────────────────────────────────────────────────────────────────
// 5f. BONUS: Effect.andThen - The "smart" operator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Effect.andThen accepts BOTH plain values AND Effects.
 * It figures out which one and does the right thing.
 *
 * Some people prefer explicit map/flatMap. Both are valid.
 */

// Works like map (plain value):
const andThenMap = user.pipe(Effect.andThen((u) => u.name.toUpperCase()))

// Works like flatMap (Effect):
const andThenFlatMap = user.pipe(Effect.andThen((u) => fetchUserProfile(u.id)))

// =============================================================================
// SECTION 6: Running Effects
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    RUNNING EFFECTS: AT THE EDGE ONLY!                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  IMPORTANT: Only run Effects at the EDGE of your program:                 ║
 * ║   - main() / entry point                                                  ║
 * ║   - HTTP handler response                                                 ║
 * ║   - CLI command handler                                                   ║
 * ║                                                                           ║
 * ║  INSIDE your program, COMPOSE Effects with yield* or flatMap.             ║
 * ║  DON'T run them in the middle!                                            ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 6a. Effect.runPromise - Most common
// ─────────────────────────────────────────────────────────────────────────────

// Run and get a Promise. Throws if effect fails.
const runWithPromise = async () => {
  const result = await Effect.runPromise(Effect.succeed(42))
  console.log(result) // 42
}

// ─────────────────────────────────────────────────────────────────────────────
// 6b. Effect.runPromiseExit - No throwing
// ─────────────────────────────────────────────────────────────────────────────

// Run and get Exit. Doesn't throw - you handle success/failure.
const runWithExit = async () => {
  const exit = await Effect.runPromiseExit(Effect.fail("oops"))
  // exit is Exit<never, string>
  // Check with Exit.isSuccess(exit) or Exit.isFailure(exit)
}

// ─────────────────────────────────────────────────────────────────────────────
// 6c. Effect.runSync - For sync effects only
// ─────────────────────────────────────────────────────────────────────────────

// Only works if the effect has no async operations
const runSynchronously = () => {
  const result = Effect.runSync(Effect.succeed(42))
  console.log(result) // 42
}

// =============================================================================
// SECTION 7: Combining Effects
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// 7a. Effect.all - Run multiple, collect results (like Promise.all)
// ─────────────────────────────────────────────────────────────────────────────

// Array of effects → Effect of array
const allArray = Effect.all([
  Effect.succeed(1),
  Effect.succeed(2),
  Effect.succeed(3),
])
// Type: Effect<[number, number, number], never, never>

// Object of effects → Effect of object (RECOMMENDED - better readability)
const allObject = Effect.all({
  user: Effect.succeed({ name: "Alice" }),
  orders: Effect.succeed([{ id: 1 }, { id: 2 }]),
  count: Effect.succeed(42),
})
// Type: Effect<{ user: { name: string }; orders: { id: number }[]; count: number }, never, never>

// With concurrency control:
const allWithConcurrency = Effect.all(
  [Effect.succeed(1), Effect.succeed(2), Effect.succeed(3)],
  { concurrency: 2 } // Only 2 at a time
)

// ─────────────────────────────────────────────────────────────────────────────
// 7b. Effect.forEach - Map array with effects
// ─────────────────────────────────────────────────────────────────────────────

// Like Array.map but for effects
const forEachExample = Effect.forEach([1, 2, 3], (n) =>
  Effect.succeed(n * 2).pipe(Effect.tap((x) => Effect.logInfo(`Doubled: ${x}`)))
)
// Type: Effect<number[], never, never>
// Value: [2, 4, 6]

// With concurrency:
const forEachConcurrent = Effect.forEach(
  ["a", "b", "c"],
  (letter) => Effect.succeed(letter.toUpperCase()),
  { concurrency: "unbounded" }
)

// ─────────────────────────────────────────────────────────────────────────────
// 7c. Other combining utilities
// ─────────────────────────────────────────────────────────────────────────────

// Effect.zip - Combine two effects into tuple
const zipped = Effect.zip(Effect.succeed(1), Effect.succeed("hello"))
// Type: Effect<[number, string], never, never>

// Effect.zipWith - Combine with a function
const zippedWith = Effect.zipWith(
  Effect.succeed(10),
  Effect.succeed(5),
  (a, b) => a + b
)
// Type: Effect<number, never, never>
// Value: 15

// =============================================================================
// SECTION 8: Common Patterns
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// 8a. Effect.delay - Delay execution
// ─────────────────────────────────────────────────────────────────────────────

const delayed = Effect.succeed(42).pipe(Effect.delay("1 second"))

// ─────────────────────────────────────────────────────────────────────────────
// 8b. Effect.timeout - Fail if too slow
// ─────────────────────────────────────────────────────────────────────────────

const withTimeout = Effect.succeed(42).pipe(Effect.timeout("5 seconds"))
// Returns Option - Some if fast enough, None if timeout

// To get an error on timeout:
const withTimeoutError = Effect.succeed(42).pipe(
  Effect.timeoutFail({
    duration: "5 seconds",
    onTimeout: () => new Error("Too slow!"),
  })
)

// ─────────────────────────────────────────────────────────────────────────────
// 8c. Effect.retry - Retry on failure
// ─────────────────────────────────────────────────────────────────────────────

// Simple retry count
const withRetry = Effect.fail("network error").pipe(
  Effect.retry(Schedule.recurs(3)) // Retry up to 3 times
)

// Exponential backoff
const withBackoff = Effect.fail("error").pipe(
  Effect.retry(
    Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(5)))
  )
)

// ─────────────────────────────────────────────────────────────────────────────
// 8d. Effect.if / Effect.when - Conditional execution
// ─────────────────────────────────────────────────────────────────────────────

// Effect.if - Choose between two effects
const conditionalEffect = (isAdmin: boolean) =>
  Effect.if(isAdmin, {
    onTrue: () => Effect.succeed("admin dashboard"),
    onFalse: () => Effect.succeed("user dashboard"),
  })

// Effect.when - Run only if condition is true
const maybeLog = Effect.when(Effect.logInfo("Debugging..."), () => process.env.DEBUG === "true")
// Returns Option - Some if ran, None if skipped

// =============================================================================
// SECTION 9: Complete Example
// =============================================================================

/**
 * Let's build a user registration flow using everything we learned.
 */

// Define functions with Effect.fn for tracing
const validateEmail = Effect.fn("validateEmail")(function* (email: string) {
  if (!email.includes("@")) {
    return yield* Effect.fail("Invalid email format" as const)
  }
  yield* Effect.logDebug(`Email validated: ${email}`)
  return email.toLowerCase()
})

const checkEmailExists = Effect.fn("checkEmailExists")(function* (
  email: string
) {
  // Simulate database check
  const existingEmails = ["taken@example.com"]
  if (existingEmails.includes(email)) {
    return yield* Effect.fail("Email already exists" as const)
  }
  return false
})

const createUser = Effect.fn("createUser")(function* (
  email: string,
  name: string
) {
  yield* Effect.logInfo(`Creating user: ${name} (${email})`)
  return {
    id: `user-${Date.now()}`,
    email,
    name,
    createdAt: new Date(),
  }
})

// Compose into a registration flow
const registerUser = Effect.fn("registerUser")(function* (
  email: string,
  name: string
) {
  // Step 1: Validate email
  const validEmail = yield* validateEmail(email)

  // Step 2: Check if exists
  yield* checkEmailExists(validEmail)

  // Step 3: Create user
  const newUser = yield* createUser(validEmail, name)

  yield* Effect.logInfo(`User registered successfully: ${newUser.id}`)
  return newUser
})

// Main program
const main = Effect.gen(function* () {
  yield* Effect.logInfo("=== User Registration Demo ===")

  const newUser = yield* registerUser("alice@example.com", "Alice")
  yield* Console.log(`Created user: ${JSON.stringify(newUser, null, 2)}`)

  return newUser
})

// Uncomment to run:
// Effect.runPromise(main).catch(console.error)

// =============================================================================
// SECTION 10: Anti-Patterns - What NOT to Do
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         COMMON MISTAKES TO AVOID                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// ❌ DON'T: Mix async/await with Effect.gen
// ─────────────────────────────────────────────────────────────────────────────

// WRONG:
// const wrong = Effect.gen(async function* () {
//   const data = await fetch(url)  // DON'T USE AWAIT!
// })

// CORRECT:
const correctAsync = Effect.gen(function* () {
  const data = yield* Effect.tryPromise({
    try: () => fetch("https://example.com").then((r) => r.json()),
    catch: (e) => new Error(`Fetch failed: ${e}`),
  })
  return data
})

// ─────────────────────────────────────────────────────────────────────────────
// ❌ DON'T: Forget to yield* effects
// ─────────────────────────────────────────────────────────────────────────────

// WRONG:
// const forgetYield = Effect.gen(function* () {
//   Effect.logInfo("This never runs!")  // Missing yield*
// })

// CORRECT:
const rememberYield = Effect.gen(function* () {
  yield* Effect.logInfo("This runs!")
})

// ─────────────────────────────────────────────────────────────────────────────
// ❌ DON'T: Use runPromise in the middle of your program
// ─────────────────────────────────────────────────────────────────────────────

// WRONG:
// const wrongMiddle = Effect.gen(function* () {
//   const result = await Effect.runPromise(someEffect)  // DON'T RUN IN MIDDLE
// })

// CORRECT:
// const correctMiddle = Effect.gen(function* () {
//   const result = yield* someEffect  // COMPOSE, DON'T RUN
// })

// ─────────────────────────────────────────────────────────────────────────────
// ❌ DON'T: Use map when you should use flatMap
// ─────────────────────────────────────────────────────────────────────────────

// WRONG - creates nested Effect:
// const wrong = Effect.succeed(1).pipe(
//   Effect.map(n => Effect.succeed(n * 2))  // Returns Effect<Effect<number>>
// )

// CORRECT - flatMap flattens:
const correctFlatMap = Effect.succeed(1).pipe(
  Effect.flatMap((n) => Effect.succeed(n * 2)) // Returns Effect<number>
)

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Section 1: Creating Effects
  succeeded,
  failed,
  synced,
  tried,
  triedWithError,
  fetched,
  promiseBased,

  // Section 2: Effect.gen
  basicGen,
  withLogging,
  validateAgeEffect,
  withConditional,
  withLoop,

  // Section 3: Effect.fn
  processUser,
  divideNumbers,
  processUserNamed,

  // Section 4: pipe
  withPipe,
  withMethodPipe,
  validateAndProcessGen,
  formatUserNamePipe,
  mixedStyleExample,

  // Section 5: Transforming
  withMap,
  withFlatMap,
  withTap,
  processUserPipeline,
  andThenMap,
  andThenFlatMap,

  // Section 7: Combining
  allArray,
  allObject,
  forEachExample,
  zipped,
  zippedWith,

  // Section 8: Common Patterns
  delayed,
  withTimeout,
  withRetry,
  conditionalEffect,

  // Section 9: Complete Example
  validateEmail,
  checkEmailExists,
  createUser,
  registerUser,
  main,
}
