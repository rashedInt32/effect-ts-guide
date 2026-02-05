/**
 * =============================================================================
 * EFFECT MENTAL MODELS - THE FOUNDATION
 * =============================================================================
 *
 * This file contains the CORE mental models you need to understand Effect.
 * Read this BEFORE diving into the other modules.
 *
 * NEW TO EFFECT? Read in order:
 *   1. Why Effect? (The Problem)
 *   2. Effects are Recipes (Lazy Evaluation)
 *   3. The Three Containers (Option/Either/Effect)
 *   4. Creating Effects
 *   5. Transforming Effects (map vs flatMap vs tap)
 *   6. Promise → Effect Translation
 *   7. Error Handling
 *   8. Dependency Injection
 *   9. Common Pitfalls
 *   10. Quick Reference Cheat Sheet
 *
 * If you know Promises, you already know 70% of Effect!
 * This guide maps your existing knowledge to Effect patterns.
 *
 * =============================================================================
 */

import { Console, Effect, Either, Option, Context, Layer, pipe } from "effect";

// =============================================================================
// SECTION 1: WHY EFFECT? - THE PROBLEM EFFECT SOLVES
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         WHY USE EFFECT?                                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  JavaScript/TypeScript has several ways to handle operations:             ║
 * ║                                                                           ║
 * ║  1. null/undefined     - "Value might not exist"                          ║
 *  ║  2. try/catch         - "Operation might fail"                            ║
 *  ║  3. Promise           - "Async operation"                                 ║
 *  ║  4. Dependency injection - "Needs external services"                      ║
 *  ║                                                                           ║
 *  ║  PROBLEM: These are all DIFFERENT patterns with different syntax!         ║
 *  ║                                                                           ║
 *  ║  EFFECT solves this by unifying them into ONE consistent API:             ║
 *  ║                                                                           ║
 *  ║  Effect<Success, Error, Requirements>                                     ║
 *  ║      ↑        ↑         ↑                                                ║
 *  ║   What you  What can   What you need                                    ║
 *  ║   get       go wrong   to run it                                        ║
 *  ║                                                                           ║
 *  ║  Plus: Everything is typed at compile time! No surprises.                ║
 *  ║                                                                           ║
 *  ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// SECTION 2: EFFECTS ARE RECIPES - NOT RESULTS (Lazy Evaluation)
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    THE #1 MENTAL MODEL: RECIPES                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 *  ║  This is THE most important concept. Everything else builds on this.     ║
 *  ║                                                                           ║
 *  ║  PROMISE (eager):                                                         ║
 *  ║    const userPromise = fetchUser()  // Starts fetching IMMEDIATELY!      ║
 *  ║    // ^ Network request is already in flight                              ║
 *  ║                                                                           ║
 *  ║  EFFECT (lazy):                                                           ║
 *  ║    const userEffect = fetchUser()   // Just a RECIPE, nothing runs        ║
 *  ║    // ^ Zero network activity                                              ║
 *  ║                                                                           ║
 *  ║    await Effect.runPromise(userEffect)  // NOW it runs!                   ║
 *  ║                                                                           ║
 *  ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 *  Analogy: Recipe Book
 *
 *    ┌───────────────────────────────────────────────────────────────────────┐
 *    │                                                                       │
 *    │  RECIPE (Effect)                    EXECUTION                         │
 *    │  ────────────────                   ─────────                         │
 *    │                                                                       │
 *    │  1. Buy ingredients                →  Actually go to store            │
 *    │  2. Preheat oven                   →  Actually turn on oven           │
 *    │  3. Mix ingredients                →  Actually mix                    │
 *    │  4. Bake 30 min                    →  Actually wait                   │
 *    │                                                                       │
 *    │  The recipe is just a DESCRIPTION.  Running it makes the cake.        │
 *    │                                                                       │
 *    │  You can:                                                             │
 *    │    • Copy the recipe (reuse)                                          │
 *    │    • Combine recipes (compose)                                        │
 *    │    • Modify recipes (transform)                                       │
 *    │    • Run same recipe multiple times                                   │
 *    │                                                                       │
 *    └───────────────────────────────────────────────────────────────────────┘
 */

// This is just a RECIPE - nothing runs yet!
const fetchUserRecipe = Effect.tryPromise({
  try: () => fetch("/api/user").then((r) => r.json()),
  catch: (e) => new Error(`Fetch failed: ${e}`),
});
// Type: Effect<unknown, Error, never>
//              ↑           ↑         ↑
//        Success      Error   Requirements (none)

// This is ANOTHER recipe that COMBINES the first one
const processUserRecipe = Effect.gen(function* () {
  yield* Effect.logInfo("Starting..."); // Step 1
  const user = yield* fetchUserRecipe; // Step 2 (yield* = "do this step")
  yield* Effect.logInfo(`Got: ${user}`); // Step 3
  return user;
});
// Still just a recipe! Nothing has run.

// FINALLY, we run it (only at the "edge" of our program)
// Effect.runPromise(processUserRecipe)

// Why is this powerful?
// 1. COMPOSE: Build complex flows from simple pieces BEFORE running
// 2. REUSE: Run the same recipe multiple times
// 3. TEST: Same recipe, different "kitchen" (mock services)
// 4. CONTROL: Add timeout, retry, logging without changing the recipe

const recipeWithRetry = processUserRecipe.pipe(Effect.retry({ times: 3 }));
const recipeWithTimeout = processUserRecipe.pipe(Effect.timeout("5 seconds"));

// =============================================================================
// SECTION 3: THE THREE CONTAINERS
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     THINKING IN CONTAINERS                                 ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 *  ║  Effect provides three main "containers" for values. Each adds different ║
 *  ║  MEANING to your data.                                                   ║
 *  ║                                                                           ║
 *  ║  ┌──────────────────────────────────────────────────────────────────┐   ║
 *  ║  │ CONTAINER      │ MEANING                    │ USE WHEN           │   ║
 *  ║  ├──────────────────────────────────────────────────────────────────┤   ║
 *  ║  │ Option<A>      │ "Value might not exist"    │ Nullable lookups   │   ║
 *  ║  │ Either<A, E>   │ "Success or failure"       │ Validation/parsing │   ║
 *  ║  │ Effect<A, E, R>│ "Async/IO operation"       │ Network, DB, files │   ║
 *  ║  └──────────────────────────────────────────────────────────────────┘   ║
 *  ║                                                                           ║
 *  ║  Think of them as shipping boxes with different labels:                   ║
 *  ║                                                                           ║
 *  ║   📦 Option      - "Fragile: Might be empty"                              ║
 *  ║   📦 Either      - "Handle with care: Success OR Error"                   ║
 *  ║   📦 Effect      - "Recipe inside: Run to get result"                     ║
 *  ║                                                                           ║
 *  ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER 1: Option<A> - "Might not exist"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Option represents a value that might or might not exist.
 *
 * WHEN TO USE:
 *   • Dictionary lookups (might not find the key)
 *   • Optional config values
 *   • Array.find() results
 *   • Nullable database fields
 *
 * VS JAVASCRIPT: null | undefined | T
 *
 * BENEFIT: Forces you to handle the "missing" case. Type-safe!
 */

// Creating Options
const someValue = Option.some(42); // Option<number> - has a value
const noValue = Option.none<number>(); // Option<number> - empty

// From nullable (most common)
const fromNull = Option.fromNullable(null); // None
const fromValue = Option.fromNullable("hello"); // Some("hello")

// Real example: Find user in cache
const users: { id: number; name: string }[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

const findUser = (id: number): Option.Option<{ id: number; name: string }> =>
  Option.fromNullable(users.find((u) => u.id === id));

// Using Options (you MUST handle both cases!)
const handleOption = (opt: Option.Option<number>) => {
  // Pattern 1: Get with default (MOST COMMON)
  const value = Option.getOrElse(opt, () => 0);

  // Pattern 2: Match both cases
  const result = Option.match(opt, {
    onNone: () => "No value",
    onSome: (n) => `Got ${n}`,
  });

  return { value, result };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER 2: Either<A, E> - "Success or Failure"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Either represents a computation that can succeed (Right) or fail (Left).
 *
 * WHEN TO USE:
 *   • Validation (email, password strength)
 *   • Parsing (JSON, dates)
 *   • Sync computations that can fail
 *
 * VS JAVASCRIPT: try/catch, but typed and functional
 *
 * BENEFIT: Errors are part of the type. Can't ignore them!
 */

// Creating Either values
const success = Either.right(42); // Either<number, never>
const failure = Either.left("Something went wrong"); // Either<never, string>

// Real example: Email validation
interface ValidationError {
  field: string;
  message: string;
}

const validateEmail = (
  email: string,
): Either.Either<string, ValidationError> => {
  if (!email.includes("@")) {
    return Either.left({ field: "email", message: "Must contain @" });
  }
  if (email.length < 5) {
    return Either.left({ field: "email", message: "Too short" });
  }
  return Either.right(email.toLowerCase());
};

// Using Either
const handleEither = (result: Either.Either<string, ValidationError>) =>
  Either.match(result, {
    onLeft: (error) => `❌ ${error.field}: ${error.message}`,
    onRight: (value) => `✅ Valid: ${value}`,
  });

// Test it
const valid = validateEmail("ALICE@example.com");
const invalid = validateEmail("alice");

console.log(handleEither(valid)); // ✅ Valid: alice@example.com
console.log(handleEither(invalid)); // ❌ email: Must contain @

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER 3: Effect<A, E, R> - "Async/IO Operation"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Effect is the MAIN container. It represents an operation that:
 *   • Might fail (typed errors)
 *   • Might need dependencies
 *   • Might do async/IO work
 *
 * WHEN TO USE:
 *   • HTTP requests
 *   • Database queries
 *   • File operations
 *   • Anything needing services/logging
 *
 * KEY PROPERTIES:
 *   • LAZY: Just a recipe until you run it
 *   • TYPED: Error and Requirements in the type
 *   • COMPOSABLE: Build big effects from small ones
 */

// Creating Effects
const succeed = Effect.succeed(42); // Effect<number, never, never>
const fail = Effect.fail("oops"); // Effect<never, string, never>

// From sync code that might throw
const parseJson = (input: string) =>
  Effect.try({
    try: () => JSON.parse(input) as unknown,
    catch: (e) => new Error(`Parse error: ${e}`),
  });

// From async code (Promise)
const fetchData = Effect.tryPromise({
  try: () => fetch("/api/data").then((r) => r.json()),
  catch: (e) => new Error(`Fetch failed: ${e}`),
});

// =============================================================================
// SECTION 4: WHEN TO USE WHICH CONTAINER
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      CHOOSING THE RIGHT CONTAINER                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 *  ║  DECISION TREE:                                                           ║
 *  ║                                                                           ║
 *  ║  Is it async OR needs services OR has side effects?                      ║
 *  ║       │                                                                   ║
 *  ║      YES ──────────────────────────→ Effect                               ║
 *  ║       │                                                                   ║
 *  ║       NO                                                                  ║
 *  ║       │                                                                   ║
 *  ║  Can it fail with useful error info?                                     ║
 *  ║       │                                                                   ║
 *  ║      YES ──────────────────────────→ Either                               ║
 *  ║       │                                                                   ║
 *  ║       NO                                                                  ║
 *  ║       │                                                                   ║
 *  ║  Might the value be absent?                                              ║
 *  ║       │                                                                   ║
 *  ║      YES ──────────────────────────→ Option                               ║
 *  ║       │                                                                   ║
 *  ║       NO                                                                  ║
 *  ║       │                                                                   ║
 *  ║      Just use the plain value!                                           ║
 *  ║                                                                           ║
 *  ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Examples:

// Mock cache for the example
const cache: Record<number, { name: string }> = { 1: { name: "Cached" } };

// Option: Cache lookup (might not exist)
const getCachedUser = (id: number): Option.Option<{ name: string }> =>
  Option.fromNullable(cache[id]);

// Either: Validation (can fail with error details)
const validatePassword = (password: string): Either.Either<string, string> =>
  password.length < 8
    ? Either.left("Password too short")
    : Either.right(password);

// Effect: HTTP request (async, might fail, needs network)
const createUser = (data: unknown) =>
  Effect.tryPromise({
    try: () =>
      fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    catch: (e) => new Error(`Create user failed: ${e}`),
  });

// =============================================================================
// SECTION 5: TRANSFORMING EFFECTS (CRITICAL!)
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    MAP vs FLATMAP vs TAP                                   ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 *  ║  This is where most beginners get confused. Read carefully!               ║
 *  ║                                                                           ║
 *  ║  THE QUESTION IS: What does YOUR CALLBACK FUNCTION return?               ║
 *  ║                                                                           ║
 *  ║  ┌────────────────────────────────────────────────────────────────────┐  ║
 *  ║  │ YOUR CALLBACK RETURNS    │ USE      │ RESULT                       │  ║
 *  ║  ├────────────────────────────────────────────────────────────────────┤  ║
 *  ║  │ Plain value (B)          │ map      │ Effect<B>                    │  ║
 *  ║  │ Effect<B>                │ flatMap  │ Effect<B> (flattened)        │  ║
 *  ║  │ Effect<anything>         │ tap      │ Effect<A> (original value)   │  ║
 *  ║  └────────────────────────────────────────────────────────────────────┘  ║
 *  ║                                                                           ║
 *  ║  ALL THREE return Effect! The question is what YOUR function returns.     ║
 *  ║                                                                           ║
 *  ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const userEffect = Effect.succeed({
  id: 1,
  name: "alice",
  email: "alice@example.com",
});

// ─────────────────────────────────────────────────────────────────────────────
// map - YOUR FUNCTION returns a PLAIN VALUE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Use map when: Your callback transforms the value and returns a PLAIN result
 *
 * Your callback: (A) => B
 * map returns: Effect<B>
 *
 * Example: Transform user → user's name (string)
 */

const withMap = userEffect.pipe(
  Effect.map((user) => user.name.toUpperCase()),
  // Your function:  (user) => "ALICE"     ← Returns PLAIN string
  // map returns:     Effect<string>       ← map wraps it for you
);
// Type: Effect<string, never, never>

// Chain multiple maps for sequential transformations
const calculateTotal = Effect.succeed({ price: 100, quantity: 3 }).pipe(
  Effect.map((order) => order.price * order.quantity), // → 300
  Effect.map((subtotal) => subtotal * 1.1), // Add 10% tax → 330
  Effect.map((total) => `$${total.toFixed(2)}`), // → "$330.00"
);

// ─────────────────────────────────────────────────────────────────────────────
// flatMap - YOUR FUNCTION returns an EFFECT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Use flatMap when: Your callback needs to do effectful work (returns Effect)
 *
 * Your callback: (A) => Effect<B>
 * flatMap returns: Effect<B> (flattened!)
 *
 * Why "flatMap"? It "flattens" Effect<Effect<B>> into Effect<B>
 *
 * Example: Get user → fetch their profile (which returns Effect)
 */
const fetchUserProfile = (userId: number) =>
  Effect.succeed({ userId, bio: "Hello!", avatar: "avatar.png" });

const withFlatMap = userEffect.pipe(
  Effect.flatMap((user) => fetchUserProfile(user.id)),
  // Your function:  (user) => Effect<Profile>  ← Returns EFFECT
  // flatMap returns: Effect<Profile>            ← flatMap unwraps it
);
// Type: Effect<{ userId: number; bio: string; avatar: string }, never, never>

// WITHOUT flatMap (using map instead) - BAD!
const nestedBad = userEffect.pipe(
  Effect.map((user) => fetchUserProfile(user.id)),
  // Returns: Effect<Effect<Profile>> ← Nested! Wrong!
);

// WITH flatMap - GOOD!
const flattenedGood = userEffect.pipe(
  Effect.flatMap((user) => fetchUserProfile(user.id)),
  // Returns: Effect<Profile> ← Flat! Correct!
);

// ─────────────────────────────────────────────────────────────────────────────
// tap - YOUR FUNCTION does a SIDE EFFECT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Use tap when: You want to DO something but keep the original value
 *
 * Your callback: (A) => Effect<anything>
 * tap returns: Effect<A> (ORIGINAL value passes through!)
 *
 * Common uses: Logging, metrics, debugging, audit trails
 */
const withTap = userEffect.pipe(
  Effect.tap((user) => Effect.logInfo(`Processing: ${user.name}`)), // Log
  Effect.tap((user) => Console.log(`Email: ${user.email}`)), // Console
  Effect.map((user) => user.name.toUpperCase()), // Actually transform
);
// Type: Effect<string, never, never>
// tap returns the ORIGINAL user, then map transforms it

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE PIPELINE EXAMPLE
// ─────────────────────────────────────────────────────────────────────────────

const processOrder = Effect.succeed({ orderId: "123", amount: 100 }).pipe(
  // tap: Log the incoming order (keep original)
  Effect.tap((order) => Effect.logInfo(`Processing order ${order.orderId}`)),

  // flatMap: Validate order (returns Effect)
  Effect.flatMap((order) =>
    order.amount > 0 ? Effect.succeed(order) : Effect.fail("Invalid amount"),
  ),

  // map: Calculate total (plain value)
  Effect.map((order) => ({ ...order, total: order.amount * 1.1 })),

  // tap: Log the result (keep value)
  Effect.tap((order) => Effect.logInfo(`Total: ${order.total}`)),

  // map: Extract just the total
  Effect.map((order) => order.total),
);

// =============================================================================
// SECTION 6: PROMISE TO EFFECT TRANSLATION
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                   PROMISE → EFFECT TRANSLATION GUIDE                       ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 *  ║  ┌─────────────────────────────┬─────────────────────────────────────┐   ║
 *  ║  │ PROMISE                     │ EFFECT                              │   ║
 *  ║  ├─────────────────────────────┼─────────────────────────────────────┤   ║
 *  ║  │ Promise.resolve(value)      │ Effect.succeed(value)               │   ║
 *  ║  │ Promise.reject(error)       │ Effect.fail(error)                  │   ║
 *  ║  │ await promise               │ yield* effect (in Effect.gen)       │   ║
 *  ║  │ promise.then(fn)            │ Effect.map(fn) or flatMap           │   ║
 *  ║  │ promise.catch(fn)           │ Effect.catchAll(fn)                 │   ║
 *  ║  │ Promise.all([...])          │ Effect.all([...])                   │   ║
 *  ║  │ Promise.race([...])         │ Effect.race(effect1, effect2)       │   ║
 *  ║  │ async function              │ Effect.gen(function* () {...})      │   ║
 *  ║  └─────────────────────────────┴─────────────────────────────────────┘   ║
 *  ║                                                                           ║
 *  ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// Example 1: Fetching Data
// ─────────────────────────────────────────────────────────────────────────────

// PROMISE VERSION
async function fetchUserPromise(id: string): Promise<{ name: string }> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<{ name: string }>;
}

// EFFECT VERSION
const fetchUserEffect = (id: string): Effect.Effect<{ name: string }, Error> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(`/api/users/${id}`),
      catch: (e) => new Error(`Network error: ${e}`),
    });

    if (!response.ok) {
      return yield* Effect.fail(new Error(`HTTP ${response.status}`));
    }

    return yield* Effect.tryPromise({
      try: () => response.json() as Promise<{ name: string }>,
      catch: (e) => new Error(`JSON parse error: ${e}`),
    });
  });

// ─────────────────────────────────────────────────────────────────────────────
// Example 2: Sequential Operations
// ─────────────────────────────────────────────────────────────────────────────

// PROMISE VERSION
async function processUserPromise(id: string) {
  console.log("Starting...");
  const user = await fetchUserPromise(id);
  console.log(`Got user: ${user.name}`);
  const upperName = user.name.toUpperCase();
  console.log("Done!");
  return upperName;
}

// EFFECT VERSION (Effect.gen - like async/await)
const processUserGen = (id: string) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Starting...");
    const user = yield* fetchUserEffect(id);
    yield* Effect.logInfo(`Got user: ${user.name}`);
    const upperName = user.name.toUpperCase();
    yield* Effect.logInfo("Done!");
    return upperName;
  });

// EFFECT VERSION (pipe - functional style)
const processUserPipe = (id: string) =>
  fetchUserEffect(id).pipe(
    Effect.tap((user) => Effect.logInfo(`Got user: ${user.name}`)),
    Effect.map((user) => user.name.toUpperCase()),
    Effect.tap(() => Effect.logInfo("Done!")),
  );

// ─────────────────────────────────────────────────────────────────────────────
// Example 3: Parallel Operations
// ─────────────────────────────────────────────────────────────────────────────

// PROMISE VERSION
async function fetchMultiplePromise(ids: string[]) {
  return Promise.all(ids.map(fetchUserPromise));
}

// EFFECT VERSION
const fetchMultipleEffect = (ids: string[]) =>
  Effect.all(ids.map(fetchUserEffect));
// Default is sequential. For parallel:
// Effect.all(ids.map(fetchUserEffect), { concurrency: "unbounded" })

// =============================================================================
// SECTION 7: ERROR HANDLING
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      ERRORS ARE TYPED, NOT HIDDEN                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 *  ║  JavaScript:                                                              ║
 *  ║    async function fetchUser(): Promise<User>                              ║
 *  ║    // What errors can this throw? Check docs... maybe?                   ║
 *  ║                                                                           ║
 *  ║  Effect:                                                                  ║
 *  ║    Effect<User, NetworkError | NotFoundError, never>                      ║
 *  ║    // ^ Errors are RIGHT HERE in the type!                               ║
 *  ║                                                                           ║
 *  ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Define typed errors with _tag for discrimination
class NetworkError2 {
  readonly _tag = "NetworkError" as const;
  constructor(readonly message: string) {}
}

class NotFoundError2 {
  readonly _tag = "NotFoundError" as const;
  constructor(readonly resource: string) {}
}

class ValidationError2 {
  readonly _tag = "ValidationError" as const;
  constructor(
    readonly field: string,
    readonly message: string,
  ) {}
}

// Function that can fail with multiple error types
const fetchUserOrFail = (id: number) =>
  Effect.gen(function* () {
    if (id < 0) {
      return yield* Effect.fail(new ValidationError2("id", "Must be positive"));
    }
    if (id === 0) {
      return yield* Effect.fail(new NotFoundError2(`user/${id}`));
    }
    if (Math.random() < 0.1) {
      return yield* Effect.fail(new NetworkError2("Connection refused"));
    }
    return { id, name: "Alice" };
  });
// Type: Effect<{id, name}, ValidationError | NotFoundError | NetworkError, never>

// Handle specific error types with catchTag
const handleUserFetch = fetchUserOrFail(1).pipe(
  // Handle NotFoundError specifically
  Effect.catchTag("NotFoundError", (error) =>
    Effect.succeed({ id: 0, name: `Unknown (${error.resource})` }),
  ),

  // Handle NetworkError specifically
  Effect.catchTag("NetworkError", (error) =>
    Effect.gen(function* () {
      yield* Effect.logWarning(`Network issue: ${error.message}`);
      return { id: 1, name: "Cached User" };
    }),
  ),
  // ValidationError is NOT handled - still in the error type!
);
// Type: Effect<{id, name}, ValidationError, never>

// =============================================================================
// SECTION 8: DEPENDENCY INJECTION (THE "R" IN EFFECT<A, E, R>)
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     DEPENDENCIES (Requirements)                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 *  ║  Effect<A, E, R> - R is what your Effect needs to run                    ║
 *  ║                                                                           ║
 *  ║  Think of R as a CHECKLIST: "To run me, you must provide these"          ║
 *  ║                                                                           ║
 *  ║  Example:                                                                 ║
 *  ║    Effect<User, Error, Database | Logger>                                 ║
 *  ║    // ^ To run this, you need Database AND Logger services               ║
 *  ║                                                                           ║
 *  ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Step 1: Define a service interface
class Database extends Context.Tag("Database")<
  Database,
  {
    query: (sql: string) => Effect.Effect<unknown[], Error>;
    save: (table: string, data: unknown) => Effect.Effect<void, Error>;
  }
>() {}

// Step 2: Write code that USES the service
const getUserById = (id: number) =>
  Effect.gen(function* () {
    const db = yield* Database; // Get service from context
    const users = yield* db.query(`SELECT * FROM users WHERE id = ${id}`);
    return users[0];
  });
// Type: Effect<unknown, Error, Database>
//                              ↑
//                   Requires Database to run!

// Step 3: Provide an implementation
const MockDatabase = Database.of({
  query: (sql) => Effect.succeed([{ id: 1, name: "Mock User" }]),
  save: () => Effect.succeed(void 0),
});

const RealDatabase = Database.of({
  query: (sql) =>
    Effect.tryPromise({
      try: () =>
        fetch(`/api/query?sql=${sql}`).then(
          (r) => r.json() as Promise<unknown[]>,
        ),
      catch: (e) => new Error(`DB error: ${e}`),
    }),
  save: (table, data) =>
    Effect.tryPromise({
      try: () =>
        fetch(`/api/${table}`, {
          method: "POST",
          body: JSON.stringify(data),
        }).then((r) => r.json()),
      catch: (e) => new Error(`Save failed: ${e}`),
    }),
});

// Use the service with different implementations
const withMockDb = getUserById(1).pipe(
  Effect.provideService(Database, MockDatabase),
);

const withRealDb = getUserById(1).pipe(
  Effect.provideService(Database, RealDatabase),
);

// =============================================================================
// SECTION 9: COMMON PITFALLS
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         MISTAKES TO AVOID                                  ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 *  ║  Read this section carefully - these trip up almost every beginner!      ║
 *  ║                                                                           ║
 *  ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// PITFALL 1: Forgetting to use yield* in Effect.gen
// ─────────────────────────────────────────────────────────────────────────────

// ❌ WRONG: Effect never runs!
const forgetYield = Effect.gen(function* () {
  Effect.logInfo("This never prints!"); // Missing yield*
});

// ✅ CORRECT: Use yield* to execute the effect
const rememberYield = Effect.gen(function* () {
  yield* Effect.logInfo("This prints!"); // yield* = "do this now"
});

// ─────────────────────────────────────────────────────────────────────────────
// PITFALL 2: Double-wrapping with Option.fromNullable
// ─────────────────────────────────────────────────────────────────────────────

const getConfigValue = (key: string): Option.Option<string> =>
  Option.fromNullable({ api: "url" }[key]);

// ❌ WRONG: Function already returns Option!
const doubleWrapBad = Option.fromNullable(getConfigValue("api"));
// Creates Option<Option<string>> - nested!

// ✅ CORRECT: Use it directly
const singleWrapGood = getConfigValue("api");
// Returns Option<string> - correct!

// ─────────────────────────────────────────────────────────────────────────────
// PITFALL 3: Using map when you should use flatMap
// ─────────────────────────────────────────────────────────────────────────────

// ❌ WRONG: map creates nested Effect
const nestedBad2 = Effect.succeed({ id: 1 }).pipe(
  Effect.map((user) => fetchUserProfile(user.id)),
  // Returns Effect<Effect<Profile>> - nested!
);

// ✅ CORRECT: flatMap flattens
const flattenedGood2 = Effect.succeed({ id: 1 }).pipe(
  Effect.flatMap((user) => fetchUserProfile(user.id)),
  // Returns Effect<Profile> - flat!
);

// ─────────────────────────────────────────────────────────────────────────────
// PITFALL 4: Running Effects in the middle of your program
// ─────────────────────────────────────────────────────────────────────────────

// ❌ WRONG: Don't run in the middle!
const runInMiddle = Effect.gen(function* () {
  // const result = await Effect.runPromise(someEffect) // DON'T DO THIS
});

// ✅ CORRECT: Compose with yield* or flatMap
const composeCorrect = Effect.gen(function* () {
  const result = yield* someEffect; // Compose, don't run
});

// Only run at the EDGE (main function, HTTP handler, etc.)
const someEffect = Effect.succeed("test");

// ─────────────────────────────────────────────────────────────────────────────
// PITFALL 5: Not handling all error cases
// ─────────────────────────────────────────────────────────────────────────────

class ErrorA {
  readonly _tag = "ErrorA" as const;
}
class ErrorB {
  readonly _tag = "ErrorB" as const;
}

const mightFail = Effect.gen(function* () {
  if (Math.random() > 0.5) {
    return yield* Effect.fail(new ErrorA());
  }
  return yield* Effect.fail(new ErrorB());
});

// This still has error type ErrorA | ErrorB
const partialHandle = mightFail.pipe(
  Effect.catchTag("ErrorA", () => Effect.succeed("Recovered")),
);

// Must handle ALL errors to get Effect<Success, never, R>
const fullyHandled = mightFail.pipe(
  Effect.catchTag("ErrorA", () => Effect.succeed("Recovered A")),
  Effect.catchTag("ErrorB", () => Effect.succeed("Recovered B")),
);
// Type: Effect<string, never, never> - All errors handled!

// =============================================================================
// SECTION 10: QUICK REFERENCE CHEAT SHEET
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     EFFECT CHEAT SHEET - BOOKMARK THIS!                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 *  ║  CONTAINERS:                                                              ║
 *  ║  ───────────                                                              ║
 *  ║  Option<A>        - Value might not exist                                ║
 *  ║  Either<A, E>     - Success or failure                                   ║
 *  ║  Effect<A, E, R>  - Async/IO operation                                   ║
 *  ║                                                                           ║
 *  ║  CREATING EFFECTS:                                                        ║
 *  ║  ──────────────────                                                       ║
 *  ║  Effect.succeed(value)           - Immediate success                     ║
 *  ║  Effect.fail(error)              - Immediate failure                     ║
 *  ║  Effect.try({ try, catch })      - Sync that might throw                 ║
 *  ║  Effect.tryPromise({ try, catch }) - Async that might reject             ║
 *  ║                                                                           ║
 *  ║  TRANSFORMING:                                                            ║
 *  ║  ──────────────                                                           ║
 *  ║  Effect.map(effect, fn)          - fn returns plain value                ║
 *  ║  Effect.flatMap(effect, fn)      - fn returns Effect                     ║
 *  ║  Effect.tap(effect, fn)          - fn returns Effect (side effect)       ║
 *  ║                                                                           ║
 *  ║  COMPOSING:                                                               ║
 *  ║  ──────────                                                               ║
 *  ║  Effect.all([e1, e2])            - Run multiple, get array               ║
 *  ║  Effect.race(e1, e2)             - First to complete wins                ║
 *  ║  Effect.gen(function* () {...})  - Sequential operations                 ║
 *  ║                                                                           ║
 *  ║  ERROR HANDLING:                                                          ║
 *  ║  ───────────────                                                          ║
 *  ║  Effect.catchAll(effect, fn)     - Catch any error                       ║
 *  ║  Effect.catchTag("Tag", fn)      - Catch specific error type             ║
 *  ║  Effect.orDie(effect)            - Convert errors to defects             ║
 *  ║                                                                           ║
 *  ║  RUNNING:                                                                 ║
 *  ║  ────────                                                                 ║
 *  ║  Effect.runPromise(effect)       - Get Promise (throws on error)         ║
 *  ║  Effect.runPromiseExit(effect)   - Get Exit (no throw)                   ║
 *  ║  Effect.runSync(effect)          - Run sync only                         ║
 *  ║                                                                           ║
 *  ║  DECISION TREE:                                                           ║
 *  ║  ──────────────                                                           ║
 *  ║  Is it async? Yes → Effect                                               ║
 *  ║  Can it fail? Yes → Either                                               ║
 *  ║  Might be absent? Yes → Option                                           ║
 *  ║  Otherwise → Plain value                                                 ║
 *  ║                                                                           ║
 *  ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// EXPORTS (for type checking)
// =============================================================================

export {
  // Containers
  someValue,
  noValue,
  fromValue,
  success,
  failure,
  succeed,
  fail,

  // Functions
  findUser,
  validateEmail,
  parseJson,
  fetchData,

  // Examples
  withMap,
  calculateTotal,
  withFlatMap,
  withTap,
  processOrder,

  // Translations
  fetchUserPromise,
  fetchUserEffect,
  processUserGen,
  processUserPipe,

  // Error handling
  NetworkError2,
  NotFoundError2,
  ValidationError2,
  ErrorA,
  ErrorB,
  handleUserFetch,

  // DI
  Database,
  getUserById,

  // Pitfalls
  forgetYield,
  rememberYield,
  nestedBad2,
  flattenedGood2,

};

// =============================================================================
// MAIN - Uncomment to run demonstrations
// =============================================================================

// const main = Effect.gen(function* () {
//   yield* Console.log("=== Effect Mental Models Demo ===\n");

//   yield* Console.log("1. Option Example:");
//   const userOpt = findUser(1);
//   yield* Console.log(`   Found user: ${JSON.stringify(userOpt)}`);

//   yield* Console.log("\n2. Validation Example:");
//   yield* Console.log(`   ${handleEither(validateEmail("test@test.com"))}`);
//   yield* Console.log(`   ${handleEither(validateEmail("invalid"))}`);

//   yield* Console.log("\n3. Effect Pipeline:");
//   const total = yield* processOrder;
//   yield* Console.log(`   Final total: ${total}`);

//   yield* Console.log("\n4. Error Handling:");
//   const handled = yield* handleUserFetch;
//   yield* Console.log(`   Result: ${JSON.stringify(handled)}`);

//   yield* Console.log("\n=== Demo Complete ===");
// });

// Effect.runPromise(main).catch(console.error);
