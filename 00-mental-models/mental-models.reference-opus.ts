/**
 * =============================================================================
 * EFFECT MENTAL MODELS - THE FOUNDATION
 * =============================================================================
 *
 * This file contains the CORE mental models you need to understand Effect.
 * Read this BEFORE diving into the other modules.
 *
 * If you're coming from JavaScript/TypeScript with Promises, this will help
 * you translate your existing knowledge to Effect patterns.
 *
 * TABLE OF CONTENTS:
 *   1. The Container Mental Model (Effect, Option, Either)
 *   2. Promise to Effect Translation Guide
 *   3. map vs flatMap vs tap - The Decision Tree
 *   4. When to Use Option vs Either vs Effect
 *   5. The "Recipe" vs "Execution" Mental Model
 *   6. Error Handling Mental Model
 *   7. Dependency Injection Mental Model
 *
 * =============================================================================
 */

import { Console, Effect, Either, Option, pipe } from "effect";

// =============================================================================
// SECTION 1: THE CONTAINER MENTAL MODEL
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     THINKING IN CONTAINERS                                ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  In Effect, data lives inside "containers" (also called "wrappers").      ║
 * ║  These containers add MEANING to your data.                               ║
 * ║                                                                           ║
 * ║  JavaScript:                                                              ║
 * ║    const user = { name: "Alice" }     // Just data, no context            ║
 * ║                                                                           ║
 * ║  Effect:                                                                  ║
 * ║    const user = Option.some({ name: "Alice" })  // Data that MIGHT exist  ║
 * ║    const user = Effect.succeed({ name: "Alice" }) // Data from a PROCESS  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Think of containers like shipping boxes:
 *
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │                                                                         │
 *   │   PLAIN VALUE:  📦 "Alice"                                              │
 *   │                  └── Just the data, nothing else                        │
 *   │                                                                         │
 *   │   OPTION:       📦❓ Maybe("Alice") or Empty                            │
 *   │                  └── Box that might be empty                            │
 *   │                                                                         │
 *   │   EITHER:       📦✅ Right("Alice") or 📦❌ Left(Error)                 │
 *   │                  └── Box with success OR failure (sync)                 │
 *   │                                                                         │
 *   │   EFFECT:       📦⚡ Will produce "Alice" when run                      │
 *   │                  └── Box that's a RECIPE, not yet executed              │
 *   │                                                                         │
 *   └─────────────────────────────────────────────────────────────────────────┘
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER 1: Option<A> - "Might not exist"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Option represents a value that might or might not exist.
 *
 * JAVASCRIPT EQUIVALENT: null | undefined | T
 *
 * WHY USE OPTION?
 * - Forces you to handle the "missing" case
 * - Type system tracks it - can't accidentally use None as a value
 * - Composable - chain operations on optional values
 *
 * TWO STATES:
 *   Some(value) - Value exists
 *   None        - Value doesn't exist
 */

// Creating Options
const someValue = Option.some(42); // Option<number> - has a value
const noValue = Option.none<number>(); // Option<number> - empty

// From nullable (most common in real code)
const fromNull = Option.fromNullable(null); // None
const fromUndefined = Option.fromNullable(undefined); // None
const fromValue = Option.fromNullable("hello"); // Some("hello")

// Checking and extracting
const checkOption = (opt: Option.Option<number>) => {
  // Pattern 1: Check and extract
  if (Option.isSome(opt)) {
    console.log(opt.value); // TypeScript knows it's Some here
  }

  // Pattern 2: Get with default (MOST COMMON)
  const value = Option.getOrElse(opt, () => 0);

  // Pattern 3: Match both cases
  const result = Option.match(opt, {
    onNone: () => "No value",
    onSome: (n) => `Got ${n}`,
  });

  return { value, result };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER 2: Either<A, E> - "Success or Failure (sync)"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Either represents a value that is one of two types: Right (success) or Left (error).
 *
 * JAVASCRIPT EQUIVALENT: Try/catch return value, but typed
 *
 * WHY USE EITHER?
 * - Synchronous operations that can fail
 * - Errors are typed - you know exactly what can go wrong
 * - Validation, parsing, pure computations
 *
 * TWO STATES:
 *   Right(value) - Success (by convention, "right" = correct)
 *   Left(error)  - Failure
 *
 * WHEN TO USE:
 * - Parsing/validation (no I/O needed)
 * - When you want to handle errors without throwing
 * - When the computation is IMMEDIATE (not async)
 */

// Creating Either values
const success = Either.right(42); // Either<number, never>
const failure = Either.left("Something went wrong"); // Either<never, string>

// From try/catch
const parseJson = (input: string): Either.Either<unknown, Error> => {
  try {
    return Either.right(JSON.parse(input));
  } catch (e) {
    return Either.left(new Error(`Invalid JSON: ${e}`));
  }
};

// Using Either
const handleEither = (result: Either.Either<number, string>) => {
  // Pattern 1: Match both cases
  return Either.match(result, {
    onLeft: (error) => `Error: ${error}`,
    onRight: (value) => `Success: ${value}`,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER 3: Effect<A, E, R> - "A recipe that produces A, might fail with E, needs R"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Effect is the MAIN container in Effect TypeScript.
 *
 * JAVASCRIPT EQUIVALENT: Promise, but MUCH more powerful
 *
 * Effect<Success, Error, Requirements>
 *   - Success (A): What you get when it succeeds
 *   - Error (E): What errors can occur (typed!)
 *   - Requirements (R): What dependencies it needs to run
 *
 * KEY INSIGHT: Effect is a RECIPE, not an EXECUTION.
 *
 *   const fetchUser = Effect.tryPromise(() => fetch('/user'))
 *   // ^ This doesn't fetch anything! It's just a description.
 *   // You must RUN it: Effect.runPromise(fetchUser)
 *
 * WHY USE EFFECT?
 * - Typed errors (know what can go wrong at compile time)
 * - Typed dependencies (know what services are needed)
 * - Composable (build complex flows from simple pieces)
 * - Testable (easily mock dependencies)
 * - Observable (built-in logging, tracing, metrics)
 */

// Creating Effects
const successEffect = Effect.succeed(42); // Effect<number, never, never>
const failedEffect = Effect.fail("oops"); // Effect<never, string, never>

// From sync code that might throw
const parseJsonEffect = (input: string) =>
  Effect.try({
    try: () => JSON.parse(input) as unknown,
    catch: (e) => new Error(`Parse error: ${e}`),
  });
// Type: Effect<unknown, Error, never>

// From async code (Promise)
const fetchUserEffect = Effect.tryPromise({
  try: () => fetch("/api/user").then((r) => r.json()),
  catch: (e) => new Error(`Fetch failed: ${e}`),
});
// Type: Effect<unknown, Error, never>

// =============================================================================
// SECTION 2: PROMISE TO EFFECT TRANSLATION GUIDE
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                   PROMISE → EFFECT TRANSLATION                             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  If you know Promises, you already know most of Effect!                   ║
 * ║  Here's how concepts map:                                                 ║
 * ║                                                                           ║
 * ║  ┌─────────────────────────────┬─────────────────────────────────────┐   ║
 * ║  │ PROMISE                     │ EFFECT                              │   ║
 * ║  ├─────────────────────────────┼─────────────────────────────────────┤   ║
 * ║  │ Promise.resolve(value)      │ Effect.succeed(value)               │   ║
 * ║  │ Promise.reject(error)       │ Effect.fail(error)                  │   ║
 * ║  │ promise.then(fn)            │ Effect.map(fn) or Effect.flatMap    │   ║
 * ║  │ promise.catch(fn)           │ Effect.catchAll(fn)                 │   ║
 * ║  │ await promise               │ yield* effect (in Effect.gen)       │   ║
 * ║  │ Promise.all([...])          │ Effect.all([...])                   │   ║
 * ║  │ async function              │ Effect.gen(function* () {...})      │   ║
 * ║  │ try/catch                   │ Effect.catchAll or Effect.catchTag  │   ║
 * ║  └─────────────────────────────┴─────────────────────────────────────┘   ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// Translation Example: Fetching a User
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PROMISE VERSION (what you know):
 */
async function fetchUserPromise(id: string): Promise<{ name: string }> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const user = await response.json();
  return user as { name: string };
}

/**
 * EFFECT VERSION (same logic):
 */
const fetchUserEffectVersion = (id: string) =>
  Effect.gen(function* () {
    // yield* is like await
    const response = yield* Effect.tryPromise({
      try: () => fetch(`/api/users/${id}`),
      catch: (e) => new Error(`Network error: ${e}`),
    });

    if (!response.ok) {
      return yield* Effect.fail(new Error(`HTTP ${response.status}`));
    }

    const user = yield* Effect.tryPromise({
      try: () => response.json() as Promise<{ name: string }>,
      catch: (e) => new Error(`JSON parse error: ${e}`),
    });

    return user;
  });
// Type: Effect<{ name: string }, Error, never>

// ─────────────────────────────────────────────────────────────────────────────
// Translation Example: Sequential Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PROMISE VERSION:
 */
async function processUserPromise(id: string) {
  console.log("Starting...");
  const user = await fetchUserPromise(id);
  console.log(`Got user: ${user.name}`);
  const upperName = user.name.toUpperCase();
  console.log("Done!");
  return upperName;
}

/**
 * EFFECT VERSION (using Effect.gen - most similar to async/await):
 */
const processUserEffect = (id: string) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Starting...");
    const user = yield* fetchUserEffectVersion(id);
    yield* Effect.logInfo(`Got user: ${user.name}`);
    const upperName = user.name.toUpperCase();
    yield* Effect.logInfo("Done!");
    return upperName;
  });

/**
 * EFFECT VERSION (using pipe - more functional style):
 */
const processUserEffectPipe = (id: string) =>
  fetchUserEffectVersion(id).pipe(
    Effect.tap(() => Effect.logInfo("Starting...")),
    Effect.map((user) => user.name.toUpperCase()),
    Effect.tap(() => Effect.logInfo("Done!")),
  );

// ─────────────────────────────────────────────────────────────────────────────
// Translation Example: Parallel Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PROMISE VERSION:
 */
async function fetchMultiplePromise(ids: string[]) {
  const users = await Promise.all(ids.map(fetchUserPromise));
  return users;
}

/**
 * EFFECT VERSION:
 */
const fetchMultipleEffect = (ids: string[]) =>
  Effect.all(ids.map(fetchUserEffectVersion), { concurrency: "unbounded" });
// Type: Effect<{ name: string }[], Error, never>

// =============================================================================
// SECTION 3: map vs flatMap vs tap - THE DECISION TREE
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║               THE MOST IMPORTANT DECISION IN EFFECT                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  When transforming values inside containers, you need to choose:          ║
 * ║                                                                           ║
 * ║    map     - Transform the value, return a PLAIN value                    ║
 * ║    flatMap - Transform the value, return another CONTAINER                ║
 * ║    tap     - Side effect only, DON'T transform the value                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * THE DECISION TREE:
 *
 *                        ┌──────────────────────────────────────┐
 *                        │ Do you need to TRANSFORM the value?  │
 *                        └──────────────────────────────────────┘
 *                                        │
 *                          ┌─────────────┴─────────────┐
 *                          ▼                           ▼
 *                         YES                          NO
 *                          │                           │
 *                          ▼                           ▼
 *            ┌──────────────────────────┐      ┌─────────────┐
 *            │ Does your transformation │      │   Use tap   │
 *            │ return an Effect/Option? │      │             │
 *            └──────────────────────────┘      └─────────────┘
 *                          │                   (side effects,
 *                ┌─────────┴─────────┐          logging, etc.)
 *                ▼                   ▼
 *               YES                  NO
 *                │                   │
 *                ▼                   ▼
 *         ┌───────────┐       ┌───────────┐
 *         │ flatMap   │       │    map    │
 *         └───────────┘       └───────────┘
 *
 *
 * SIMPLE RULE:
 *   - map:     (A) => B           (plain value out)
 *   - flatMap: (A) => Effect<B>   (container out)
 *   - tap:     (A) => Effect<_>   (side effect, ignore result)
 */

// ─────────────────────────────────────────────────────────────────────────────
// SAME EXAMPLE WITH ALL THREE
// ─────────────────────────────────────────────────────────────────────────────

const user = Effect.succeed({
  id: 1,
  name: "alice",
  email: "alice@example.com",
});

/**
 * MAP - Transform value, return PLAIN value
 *
 * Use when: Your transformation is simple and synchronous
 * Returns: The transformed value (not wrapped)
 */
const withMap = user.pipe(
  Effect.map((u) => u.name.toUpperCase()),
  // (user) => string  ← Returns plain string, not Effect<string>
);
// Type: Effect<string, never, never>
// Value: "ALICE"

/**
 * FLATMAP - Transform value, return ANOTHER EFFECT
 *
 * Use when: Your transformation needs to do more effectful work
 * Returns: An Effect (which flatMap "flattens" into the chain)
 */
const fetchUserProfile = (id: number) =>
  Effect.succeed({ id, avatar: "avatar.png", bio: "Hello!" });

const withFlatMap = user.pipe(
  Effect.flatMap((u) => fetchUserProfile(u.id)),
  // (user) => Effect<Profile>  ← Returns Effect, flatMap unwraps it
);
// Type: Effect<{ id: number; avatar: string; bio: string }, never, never>

/**
 * TAP - Side effect, DON'T change the value
 *
 * Use when: You want to do something but keep the original value
 * Returns: The ORIGINAL value (tap's result is ignored)
 */
const withTap = user.pipe(
  Effect.tap((u) => Effect.logInfo(`Processing user: ${u.name}`)),
  Effect.tap((u) => Console.log(`Email: ${u.email}`)),
  // The user object passes through unchanged
);
// Type: Effect<{ id: number; name: string; email: string }, never, never>
// Value: Still the original user object!

// ─────────────────────────────────────────────────────────────────────────────
// WHY flatMap AND NOT JUST map EVERYTHING?
// ─────────────────────────────────────────────────────────────────────────────

/**
 * If you used map when you should use flatMap, you'd get NESTED containers:
 */

// WRONG: map with a function that returns Effect
const wrongWay = user.pipe(
  Effect.map((u) => fetchUserProfile(u.id)),
  // Returns Effect<Effect<Profile>> - nested! Not what you want.
);
// Type: Effect<Effect<{ id: number; avatar: string; bio: string }, never, never>, never, never>
// ^ See the double Effect? That's bad.

// RIGHT: flatMap "flattens" the nested Effect
const rightWay = user.pipe(
  Effect.flatMap((u) => fetchUserProfile(u.id)),
  // Returns Effect<Profile> - flat! Perfect.
);
// Type: Effect<{ id: number; avatar: string; bio: string }, never, never>

// ─────────────────────────────────────────────────────────────────────────────
// BONUS: andThen - THE "I DON'T WANT TO THINK" OPERATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Effect.andThen accepts BOTH plain values AND Effects.
 * It figures out which one you gave it and does the right thing.
 *
 * Think of it as "smart flatMap" - use it when you're not sure.
 *
 * NOTE: Some prefer explicit map/flatMap for clarity. Both are valid.
 */

const withAndThen1 = user.pipe(
  Effect.andThen((u) => u.name.toUpperCase()),
  // Plain value → works like map
);

const withAndThen2 = user.pipe(
  Effect.andThen((u) => fetchUserProfile(u.id)),
  // Effect → works like flatMap
);

const withAndThen3 = user.pipe(
  Effect.andThen(Effect.succeed("constant")),
  // Can even take an Effect directly (ignores previous value)
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE EXAMPLE: Building a Pipeline
// ─────────────────────────────────────────────────────────────────────────────

const processUserPipeline = Effect.succeed({ id: 1, name: "alice" }).pipe(
  // tap: Log without changing the value
  Effect.tap((u) => Effect.logInfo(`Starting to process ${u.name}`)),

  // flatMap: Transform AND do effectful work
  Effect.flatMap((u) =>
    Effect.succeed({
      ...u,
      email: `${u.name}@example.com`,
      createdAt: new Date(),
    }),
  ),

  // map: Simple synchronous transformation
  Effect.map((u) => ({
    ...u,
    displayName: u.name.toUpperCase(),
  })),

  // tap: More logging
  Effect.tap((u) => Effect.logInfo(`Created user: ${u.displayName}`)),

  // map: Extract just what we need
  Effect.map((u) => ({ id: u.id, displayName: u.displayName })),
);

// =============================================================================
// SECTION 4: WHEN TO USE Option vs Either vs Effect
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                   CHOOSING THE RIGHT CONTAINER                             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  ┌─────────────────────────────────────────────────────────────────────┐  ║
 * ║  │                                                                     │  ║
 * ║  │  "Value might not exist"                                            │  ║
 * ║  │   • Optional config values                      → Option<A>         │  ║
 * ║  │   • Map/dictionary lookups                                          │  ║
 * ║  │   • Array find operations                                           │  ║
 * ║  │   • Nullable database fields                                        │  ║
 * ║  │                                                                     │  ║
 * ║  ├─────────────────────────────────────────────────────────────────────┤  ║
 * ║  │                                                                     │  ║
 * ║  │  "Sync operation that might fail"                                   │  ║
 * ║  │   • Parsing/validation                          → Either<A, E>      │  ║
 * ║  │   • Pure computations with errors                                   │  ║
 * ║  │   • Schema decoding                                                 │  ║
 * ║  │                                                                     │  ║
 * ║  ├─────────────────────────────────────────────────────────────────────┤  ║
 * ║  │                                                                     │  ║
 * ║  │  "Async OR needs dependencies OR has side effects"                  │  ║
 * ║  │   • HTTP requests                               → Effect<A, E, R>  │  ║
 * ║  │   • Database queries                                                │  ║
 * ║  │   • File I/O                                                        │  ║
 * ║  │   • Anything that needs a service/dependency                        │  ║
 * ║  │   • Operations with logging, metrics, tracing                       │  ║
 * ║  │                                                                     │  ║
 * ║  └─────────────────────────────────────────────────────────────────────┘  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * QUICK DECISION:
 *
 *   Is it async or need deps? ─── YES ──→ Effect
 *                │
 *               NO
 *                │
 *                ▼
 *   Can it fail? ─── YES ──→ Either (sync) or Effect (if complex)
 *        │
 *       NO
 *        │
 *        ▼
 *   Might be absent? ─── YES ──→ Option
 *        │
 *       NO
 *        │
 *        ▼
 *   Just use the plain value!
 */

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLES IN PRACTICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * OPTION: Finding a user in a list
 */
type User = { id: number; name: string };
const users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

const findUserById = (id: number): Option.Option<User> =>
  Option.fromNullable(users.find((u) => u.id === id));

// Usage
const maybeUser = findUserById(1); // Some({ id: 1, name: "Alice" })
const noUser = findUserById(999); // None

/**
 * EITHER: Validating input (sync, can fail, no I/O)
 */
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
  return Either.right(email.toLowerCase());
};

// Usage
const validEmail = validateEmail("ALICE@example.com"); // Right("alice@example.com")
const invalidEmail = validateEmail("alice"); // Left({ field: "email", message: "Must contain @" })

/**
 * EFFECT: Fetching from database (async, has dependencies)
 */
const fetchUserFromDb = (id: number) =>
  Effect.gen(function* () {
    // This would normally use a database service
    yield* Effect.logInfo(`Fetching user ${id} from database`);
    // Simulate async work
    yield* Effect.sleep("100 millis");
    return { id, name: "Alice", email: "alice@example.com" };
  });

// ─────────────────────────────────────────────────────────────────────────────
// CONVERTING BETWEEN CONTAINER TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Option → Effect
 *
 * When you have an Option but need to work in Effect context.
 */
const optionToEffect = (opt: Option.Option<User>) =>
  Option.match(opt, {
    onNone: () => Effect.fail("User not found" as const),
    onSome: (user) => Effect.succeed(user),
  });

// Or using pipe:
const optionToEffect2 = (opt: Option.Option<User>) =>
  pipe(
    opt,
    Effect.succeed,
    Effect.flatten,
    Effect.mapError(() => "User not found" as const),
  );

/**
 * Either → Effect
 *
 * When you have an Either but need to work in Effect context.
 */
const eitherToEffect = (result: Either.Either<string, ValidationError>) =>
  Either.match(result, {
    onLeft: (error) => Effect.fail(error),
    onRight: (value) => Effect.succeed(value),
  });

// Or using Either utilities:
const eitherToEffect2 = (result: Either.Either<string, ValidationError>) =>
  Either.isRight(result)
    ? Effect.succeed(result.right)
    : Effect.fail(result.left);

// =============================================================================
// SECTION 5: THE "RECIPE" VS "EXECUTION" MENTAL MODEL
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    EFFECTS ARE RECIPES, NOT RESULTS                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  This is the #1 thing that confuses people coming from Promises.          ║
 * ║                                                                           ║
 * ║  PROMISE:                                                                 ║
 * ║    const result = fetch('/api/user')  // IMMEDIATELY starts fetching!    ║
 * ║                                                                           ║
 * ║  EFFECT:                                                                  ║
 * ║    const recipe = Effect.tryPromise(() => fetch('/api/user'))             ║
 * ║    // ^ Nothing happens yet! It's just a description.                     ║
 * ║                                                                           ║
 * ║    Effect.runPromise(recipe)  // NOW it runs                              ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Think of it like a RECIPE BOOK:
 *
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │                                                                         │
 *   │  RECIPE (Effect)                          COOKING (Running)             │
 *   │  ═══════════════                          ═════════════════             │
 *   │                                                                         │
 *   │  1. Preheat oven to 350°F                 → Actually turn on oven       │
 *   │  2. Mix flour and sugar                   → Actually mix ingredients    │
 *   │  3. Bake for 30 minutes                   → Actually wait 30 mins       │
 *   │                                                                         │
 *   │  The recipe doesn't make a cake.          Running the recipe does.      │
 *   │  You can have many copies of the recipe.  Each run makes a new cake.    │
 *   │                                                                         │
 *   └─────────────────────────────────────────────────────────────────────────┘
 *
 * WHY IS THIS USEFUL?
 *
 *   1. COMPOSABILITY: Combine recipes before running
 *      const fullRecipe = fetchUser.pipe(
 *        Effect.flatMap(validateUser),
 *        Effect.flatMap(saveUser)
 *      )
 *
 *   2. RETRY: Run the same recipe multiple times
 *      fullRecipe.pipe(Effect.retry({ times: 3 }))
 *
 *   3. TESTING: Same recipe, different "kitchen" (services)
 *      fullRecipe.pipe(Effect.provide(testServices))
 *      fullRecipe.pipe(Effect.provide(productionServices))
 *
 *   4. CONTROL: Decide WHEN and HOW to run
 *      - Run with timeout
 *      - Run with tracing
 *      - Run with specific concurrency
 */

// ─────────────────────────────────────────────────────────────────────────────
// DEMONSTRATION: Same Recipe, Different Executions
// ─────────────────────────────────────────────────────────────────────────────

// This is a RECIPE - nothing runs when you define it
const logCurrentTime = Effect.gen(function* () {
  const now = new Date().toISOString();
  yield* Console.log(`Current time: ${now}`);
  return now;
});

// You can run the same recipe multiple times
const runTwice = Effect.gen(function* () {
  const time1 = yield* logCurrentTime; // First execution
  yield* Effect.sleep("1 second");
  const time2 = yield* logCurrentTime; // Second execution
  return { time1, time2 }; // Different times!
});

// The recipe itself is just data - you can pass it around
const wrapWithLogging = (recipe: Effect.Effect<string>) =>
  Effect.gen(function* () {
    yield* Console.log("=== Starting ===");
    const result = yield* recipe;
    yield* Console.log("=== Done ===");
    return result;
  });

const enhancedRecipe = wrapWithLogging(logCurrentTime);

// =============================================================================
// SECTION 6: ERROR HANDLING MENTAL MODEL
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      ERRORS ARE VALUES, NOT EXCEPTIONS                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  In Effect, errors are PART OF THE TYPE, not hidden surprises.            ║
 * ║                                                                           ║
 * ║  JAVASCRIPT:                                                              ║
 * ║    function fetchUser(): Promise<User>                                    ║
 * ║    // What errors can this throw? Who knows! Check the docs... maybe.     ║
 * ║                                                                           ║
 * ║  EFFECT:                                                                  ║
 * ║    function fetchUser(): Effect<User, NetworkError | NotFoundError>       ║
 * ║    // Errors are RIGHT THERE in the type. Can't miss them.                ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * ERROR HANDLING FLOW:
 *
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │                                                                         │
 *   │  Effect<User, NetworkError | NotFoundError, never>                      │
 *   │                    │                                                    │
 *   │                    ▼                                                    │
 *   │  catchTag("NetworkError", handleNetwork)                                │
 *   │                    │                                                    │
 *   │                    ▼                                                    │
 *   │  Effect<User, NotFoundError, never>  (NetworkError handled!)            │
 *   │                    │                                                    │
 *   │                    ▼                                                    │
 *   │  catchTag("NotFoundError", handleNotFound)                              │
 *   │                    │                                                    │
 *   │                    ▼                                                    │
 *   │  Effect<User, never, never>  (All errors handled!)                      │
 *   │                                                                         │
 *   └─────────────────────────────────────────────────────────────────────────┘
 */

// ─────────────────────────────────────────────────────────────────────────────
// Defining Tagged Errors (Best Practice)
// ─────────────────────────────────────────────────────────────────────────────

// Define error types with _tag for discrimination
class NetworkError {
  readonly _tag = "NetworkError";
  constructor(readonly message: string) {}
}

class NotFoundError {
  readonly _tag = "NotFoundError";
  constructor(readonly resource: string) {}
}

class ValidationError2 {
  readonly _tag = "ValidationError";
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
      return yield* Effect.fail(new NotFoundError(`user/${id}`));
    }
    // Simulate network issues
    if (Math.random() < 0.1) {
      return yield* Effect.fail(new NetworkError("Connection refused"));
    }
    return { id, name: "Alice" };
  });
// Type: Effect<{ id: number; name: string }, ValidationError2 | NotFoundError | NetworkError, never>

// ─────────────────────────────────────────────────────────────────────────────
// Handling Errors by Type
// ─────────────────────────────────────────────────────────────────────────────

const handleUserFetch = fetchUserOrFail(1).pipe(
  // Handle specific error type
  Effect.catchTag("NotFoundError", (e) =>
    Effect.succeed({ id: 0, name: `Unknown (${e.resource})` }),
  ),
  // Handle another specific error type
  Effect.catchTag("NetworkError", (e) =>
    Effect.gen(function* () {
      yield* Effect.logWarning(`Network issue: ${e.message}, using cache`);
      return { id: 1, name: "Cached User" };
    }),
  ),
  // ValidationError is NOT handled - still in the error type!
);
// Type: Effect<{ id: number; name: string }, ValidationError2, never>

// =============================================================================
// SECTION 7: DEPENDENCY INJECTION MENTAL MODEL
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     THE "R" IN Effect<A, E, R>                             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  R = Requirements = Dependencies your Effect needs to run                 ║
 * ║                                                                           ║
 * ║  Think of it as a CHECKLIST of things that must be provided:              ║
 * ║                                                                           ║
 * ║    Effect<User, Error, Database | Logger | Config>                        ║
 * ║                         └──────────┬──────────┘                           ║
 * ║                       "To run me, you need these"                         ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * WHY IS THIS POWERFUL?
 *
 *   1. COMPILE-TIME SAFETY: TypeScript ensures you provide all dependencies
 *   2. TESTABILITY: Swap real services for mocks easily
 *   3. MODULARITY: Services are explicit, not hidden globals
 *
 * ANALOGY: Restaurant Kitchen
 *
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │                                                                         │
 *   │  Recipe: "Make Pasta"                                                   │
 *   │  Requirements: Stove, Pot, Water, Pasta                                 │
 *   │                                                                         │
 *   │  You can't make pasta without these! The recipe DECLARES what it needs. │
 *   │                                                                         │
 *   │  Production Kitchen: Real stove, real pot, real water                   │
 *   │  Test Kitchen: Fake stove that logs "heating...", mock ingredients      │
 *   │                                                                         │
 *   │  SAME RECIPE, different "kitchens" (Layer configurations)               │
 *   │                                                                         │
 *   └─────────────────────────────────────────────────────────────────────────┘
 */

import { Context, Layer } from "effect";

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Define your service interface
// ─────────────────────────────────────────────────────────────────────────────

// Define what a "UserRepository" service looks like
class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  {
    findById: (id: number) => Effect.Effect<User | null>;
    save: (user: User) => Effect.Effect<void>;
  }
>() {}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Write code that USES the service
// ─────────────────────────────────────────────────────────────────────────────

// This effect REQUIRES UserRepository to run
const getUserName = (id: number) =>
  Effect.gen(function* () {
    // Get the service from context
    const repo = yield* UserRepository;

    // Use the service
    const user = yield* repo.findById(id);

    if (!user) {
      return yield* Effect.fail(new NotFoundError(`user/${id}`));
    }

    return user.name;
  });
// Type: Effect<string, NotFoundError, UserRepository>
//                                     └── REQUIRES UserRepository

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Provide implementations via Layers
// ─────────────────────────────────────────────────────────────────────────────

// Production implementation
const ProductionUserRepository = Layer.succeed(UserRepository, {
  findById: (id) =>
    Effect.gen(function* () {
      // In real code: database query
      yield* Effect.logInfo(`DB: Finding user ${id}`);
      return { id, name: "Alice" };
    }),
  save: (user) =>
    Effect.gen(function* () {
      yield* Effect.logInfo(`DB: Saving user ${user.name}`);
    }),
});

// Test implementation
const TestUserRepository = Layer.succeed(UserRepository, {
  findById: (id) => Effect.succeed(id === 1 ? { id, name: "Test User" } : null),
  save: (_user) => Effect.succeed(undefined),
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Run with the appropriate Layer
// ─────────────────────────────────────────────────────────────────────────────

// Production
const runInProduction = getUserName(1).pipe(
  Effect.provide(ProductionUserRepository),
);
// Type: Effect<string, NotFoundError, never>
//                                     └── Requirements satisfied!

// Test
const runInTest = getUserName(1).pipe(Effect.provide(TestUserRepository));

// =============================================================================
// SECTION 8: QUICK REFERENCE CARD
// =============================================================================

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                          EFFECT QUICK REFERENCE                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  CREATING EFFECTS                                                         ║
 * ║  ─────────────────                                                        ║
 * ║  Effect.succeed(value)           Immediate success                        ║
 * ║  Effect.fail(error)              Immediate failure                        ║
 * ║  Effect.sync(() => value)        Sync, won't throw                        ║
 * ║  Effect.try(() => value)         Sync, might throw                        ║
 * ║  Effect.tryPromise({...})        Async with error handling                ║
 * ║  Effect.gen(function* () {...})  Sequential flow (like async/await)       ║
 * ║                                                                           ║
 * ║  TRANSFORMING                                                             ║
 * ║  ────────────                                                             ║
 * ║  .pipe(Effect.map(fn))           Transform success value                  ║
 * ║  .pipe(Effect.flatMap(fn))       Transform, fn returns Effect             ║
 * ║  .pipe(Effect.tap(fn))           Side effect, keep original value         ║
 * ║  .pipe(Effect.andThen(x))        Smart: accepts value OR Effect           ║
 * ║                                                                           ║
 * ║  ERROR HANDLING                                                           ║
 * ║  ──────────────                                                           ║
 * ║  .pipe(Effect.catchAll(fn))      Catch all errors                         ║
 * ║  .pipe(Effect.catchTag("X",fn))  Catch specific tagged error              ║
 * ║  .pipe(Effect.mapError(fn))      Transform error type                     ║
 * ║  .pipe(Effect.orElse(fallback))  Use fallback on any error                ║
 * ║                                                                           ║
 * ║  RUNNING                                                                  ║
 * ║  ───────                                                                  ║
 * ║  Effect.runPromise(effect)       Run, get Promise (throws on fail)        ║
 * ║  Effect.runPromiseExit(effect)   Run, get Exit (no throw)                 ║
 * ║  Effect.runSync(effect)          Run sync effect directly                 ║
 * ║                                                                           ║
 * ║  COMBINING                                                                ║
 * ║  ─────────                                                                ║
 * ║  Effect.all([...effects])        Run all, collect results (parallel)      ║
 * ║  Effect.all({a, b, c})           Run all, get object                      ║
 * ║  Effect.forEach(arr, fn)         Map array with effectful function        ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Section 1: Containers
  someValue,
  noValue,
  fromNull,
  fromValue,
  checkOption,
  success,
  failure,
  parseJson,
  handleEither,
  successEffect,
  failedEffect,
  parseJsonEffect,
  fetchUserEffect,

  // Section 2: Promise translation
  fetchUserPromise,
  fetchUserEffectVersion,
  processUserPromise,
  processUserEffect,
  processUserEffectPipe,
  fetchMultipleEffect,

  // Section 3: map/flatMap/tap
  withMap,
  withFlatMap,
  withTap,
  wrongWay,
  rightWay,
  withAndThen1,
  withAndThen2,
  withAndThen3,
  processUserPipeline,

  // Section 4: Choosing containers
  findUserById,
  validateEmail,
  fetchUserFromDb,
  optionToEffect,
  eitherToEffect,

  // Section 5: Recipe model
  logCurrentTime,
  runTwice,
  enhancedRecipe,

  // Section 6: Error handling
  NetworkError,
  NotFoundError,
  ValidationError2,
  fetchUserOrFail,
  handleUserFetch,

  // Section 7: Dependencies
  UserRepository,
  ProductionUserRepository,
  TestUserRepository,
  getUserName,
  runInProduction,
  runInTest,
};
