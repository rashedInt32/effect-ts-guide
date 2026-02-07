/**
 * =============================================================================
 * EFFECT MENTAL MODELS - PRACTICE
 * =============================================================================
 *
 * Practice exercises to solidify the mental models.
 * Fill in the TODO sections, then run: bun run 00-mental-models/mental-models.practice.ts
 *
 * =============================================================================
 */

import { Console, Effect, Either, Option, Data, pipe } from "effect";

// =============================================================================
// EXERCISE 1: Option - Handling Missing Values
// =============================================================================

/**
 * EXERCISE 1a: Create an Option from a nullable value
 *
 * Given a function that might return null, convert it to Option.
 */
const getConfigValue = (key: string): Option.Option<string> => {
  const config: Record<string, string> = {
    API_URL: "https://api.example.com",
    DEBUG: "true",
  };
  return Option.fromNullable(config[key]);
};

// TODO: Create a function that returns Option<string> instead of string | null
const getConfigOption = (key: string): Option.Option<string> => {
  return getConfigValue(key);
};

/**
 * EXERCISE 1b: Transform and extract from Option
 *
 * Get the DEBUG config, parse it as boolean, and return a default if missing.
 */
const getDebugMode = (): boolean => {
  // TODO: Get "DEBUG" config as Option, transform to boolean, default to false
  // HINT:
  //   1. getConfigValue("DEBUG") already returns Option<string> - don't wrap it again!
  //   2. Use Option.map to transform "true" → true (compare: value === "true")
  //   3. Use Option.getOrElse to provide default false if None
  return pipe(
    getConfigValue("DEBUG"),
    Option.map((value) => value === "true"),
    Option.getOrElse(() => false),
  );
};

// =============================================================================
// EXERCISE 2: map vs flatMap - The Decision
// =============================================================================

const getUserById = (id: number) =>
  Effect.succeed({ id, name: "Alice", email: "alice@example.com" });

const getUserPreferences = (userId: number) =>
  Effect.succeed({ userId, theme: "dark", language: "en" });

/**
 * EXERCISE 2a: Use map - simple transformation
 *
 * Get user and transform to just their name (uppercase).
 */
const getUserNameUpper = (id: number) => {
  // TODO: Use getUserById and map to get uppercase name
  // HINT:
  //   - getUserById(id) returns Effect<User>
  //   - You want to transform User → string (user.name.toUpperCase())
  //   - Since your function returns a PLAIN VALUE (string), use Effect.map
  //   - Example: getUserById(id).pipe(Effect.map(user => ...))
  return pipe(
    getUserById(id),
    Effect.map(user => user.name.toUpperCase()),
  )
};

/**
 * EXERCISE 2b: Use flatMap - chained effects
 *
 * Get user, then get their preferences.
 */
const getUserWithPreferences = (id: number) => {
  // TODO: Get user, then flatMap to get preferences, return both
  // HINT:
  //   - getUserById returns Effect<User>
  //   - getUserPreferences returns Effect<Preferences>
  //   - Since getUserPreferences returns an EFFECT, use Effect.flatMap
  //   - Example: getUserById(id).pipe(Effect.flatMap(user => getUserPreferences(user.id)))
  //   - To return both, you might need Effect.gen or nested flatMap
  return pipe(
    getUserById(id),
    Effect.flatMap(user => getUserPreferences(user.id).pipe(
      Effect.map(preferences => ({ user, preferences }))
    ))
  )
};

/**
 * EXERCISE 2c: Use tap - logging without changing value
 *
 * Get user and log their email, but return the user unchanged.
 */
const getUserWithLogging = (id: number) => {
  // TODO: Get user, tap to log, return user
  // HINT:
  //   - Use Effect.tap when you want to DO something (log) but keep the original value
  //   - tap's return value is IGNORED - the user passes through unchanged
  //   - Example: getUserById(id).pipe(Effect.tap(user => Console.log(user.email)))
  return pipe(
    getUserById(id),
    Effect.tap(user => Console.log(`User email: ${user.email}`))
  )
};

// =============================================================================
// EXERCISE 3: Building a Pipeline
// =============================================================================

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

const fetchProduct = (id: number) =>
  Effect.succeed<Product>({
    id,
    name: "Widget",
    price: 29.99,
    inStock: true,
  });

const applyDiscount = (product: Product, percent: number) =>
  Effect.succeed({
    ...product,
    price: product.price * (1 - percent / 100),
  });

/**
 * EXERCISE 3: Build a product processing pipeline
 *
 * 1. Fetch product (flatMap or andThen - it returns Effect)
 * 2. Log the original price (tap)
 * 3. Apply 20% discount (flatMap - applyDiscount returns Effect)
 * 4. Log the discounted price (tap)
 * 5. Extract just the price (map)
 */
const processProduct = (id: number) => {
  // TODO: Build the pipeline using pipe and the operators
  // HINT:
  //   pipe(
  //     fetchProduct(id),
  //     Effect.tap(product => Console.log(`Original: ${product.price}`)),
  //     Effect.flatMap(product => applyDiscount(product, 20)),
  //     Effect.tap(product => Console.log(`Discounted: ${product.price}`)),
  //     Effect.map(product => product.price)
  //   )
  throw new Error("TODO: Implement this");
};

// =============================================================================
// EXERCISE 4: Choosing the Right Container
// =============================================================================

/**
 * EXERCISE 4a: Should this return Option, Either, or Effect?
 *
 * Look up a user's age from a local cache (sync, might not exist)
 */
// TODO: What's the right return type? Implement it.
const getUserAge = (userId: string): Option.Option<number> => {
  const cache: Record<string, number> = { user1: 25, user2: 30 };
  // HINT:
  //   - This is SYNC (no async)
  //   - Value might not exist (but that's not an "error", just absence)
  //   - Use Option! Option.fromNullable(cache[userId])
  throw new Error("TODO: Implement this");
};

/**
 * EXERCISE 4b: Should this return Option, Either, or Effect?
 *
 * Parse a date string (sync, can fail with error info)
 */
// TODO: What's the right return type? Implement it.
const parseDate = (input: string): Either.Either<Date, string> => {
  // HINT:
  //   - This is SYNC (no async)
  //   - It can FAIL with useful error info (not just "missing")
  //   - Use Either! Either.right(date) or Either.left("Invalid date format")
  throw new Error("TODO: Implement this");
};

/**
 * EXERCISE 4c: Should this return Option, Either, or Effect?
 *
 * Save to database (async, needs logging)
 */
// TODO: What's the right return type? Implement it.
const saveToDatabase = (data: unknown): Effect.Effect<void, Error> => {
  // HINT:
  //   - This is ASYNC (database calls)
  //   - Might need services (logging, db connection)
  //   - Use Effect!
  throw new Error("TODO: Implement this");
};

// =============================================================================
// EXERCISE 5: Error Handling with Tagged Errors
// =============================================================================

// Defined error types using Data.TaggedError (Effect's recommended approach)
class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly userId: number;
}> {}

class PermissionDeniedError extends Data.TaggedError("PermissionDeniedError")<{
  readonly action: string;
}> {}

const fetchSecureUser = (id: number, isAdmin: boolean) =>
  Effect.gen(function* () {
    if (!isAdmin) {
      return yield* Effect.fail(new PermissionDeniedError({ action: "fetchUser" }));
    }
    if (id === 0) {
      return yield* Effect.fail(new UserNotFoundError({ userId: id }));
    }
    return { id, name: "Secret User", clearanceLevel: 5 };
  });

/**
 * EXERCISE 5: Handle errors by tag
 *
 * - If UserNotFoundError: return a "guest" user
 * - If PermissionDeniedError: let it propagate (don't handle)
 */
const fetchUserWithFallback = (id: number, isAdmin: boolean) => {
  // TODO: Use fetchSecureUser and catchTag to handle UserNotFoundError
  // HINT:
  //   fetchSecureUser(id, isAdmin).pipe(
  //     Effect.catchTag("UserNotFoundError", (error) =>
  //       Effect.succeed({ id: 0, name: "Guest", clearanceLevel: 0 })
  //     )
  //   )
  //
  //   catchTag ONLY catches errors with that specific _tag
  //   PermissionDeniedError will still propagate!
  throw new Error("TODO: Implement this");
};

// =============================================================================
// EXERCISE 6: Converting Between Containers
// =============================================================================

/**
 * EXERCISE 6: Option to Effect
 *
 * You have a function that returns Option<User>.
 * Convert it to Effect, failing with "User not found" if None.
 */
const findUserInCache = (
  id: number,
): Option.Option<{ id: number; name: string }> =>
  id === 1 ? Option.some({ id: 1, name: "Cached User" }) : Option.none();

const getOrFailUser = (id: number) => {
  // TODO: Convert Option to Effect, fail if None
  // HINT:
  //   Option.match gives you full control:
  //
  //   pipe(
  //     findUserInCache(id),
  //     Option.match({
  //       onNone: () => Effect.fail("User not found"),
  //       onSome: (user) => Effect.succeed(user)
  //     })
  //   )
  //
  //   Or shorter: Effect.fromOption with onNone:
  //   findUserInCache(id).pipe(
  //     Effect.fromOption(() => "User not found")  // Error if None
  //   )
  throw new Error("TODO: Implement this");
};

// =============================================================================
// RUN TESTS
// =============================================================================

const runTests = Effect.gen(function* () {
  yield* Console.log("=== Mental Models Practice Tests ===\n");

  // Uncomment tests as you implement each exercise:

  // yield* Console.log("Exercise 1a: getConfigOption")
  // yield* Console.log(`  API_URL: ${JSON.stringify(getConfigOption("API_URL"))}`)
  // yield* Console.log(`  MISSING: ${JSON.stringify(getConfigOption("MISSING"))}`)

  // yield* Console.log("\nExercise 1b: getDebugMode")
  // yield* Console.log(`  Debug mode: ${getDebugMode()}`)

  // yield* Console.log("\nExercise 2a: getUserNameUpper")
  // const name = yield* getUserNameUpper(1)
  // yield* Console.log(`  Name: ${name}`)

  // yield* Console.log("\nExercise 2b: getUserWithPreferences")
  // const userWithPrefs = yield* getUserWithPreferences(1)
  // yield* Console.log(`  Result: ${JSON.stringify(userWithPrefs)}`)

  // yield* Console.log("\nExercise 2c: getUserWithLogging")
  // const userLogged = yield* getUserWithLogging(1)
  // yield* Console.log(`  User: ${JSON.stringify(userLogged)}`)

  // yield* Console.log("\nExercise 3: processProduct")
  // const price = yield* processProduct(1)
  // yield* Console.log(`  Final price: ${price}`)

  // yield* Console.log("\nExercise 4: Container choices")
  // yield* Console.log(`  (Check your return types!)`)

  // yield* Console.log("\nExercise 5: fetchUserWithFallback")
  // const fallbackUser = yield* fetchUserWithFallback(0, true)  // Not found -> guest
  // yield* Console.log(`  Guest user: ${JSON.stringify(fallbackUser)}`)

  // yield* Console.log("\nExercise 6: getOrFailUser")
  // const cachedUser = yield* getOrFailUser(1)
  // yield* Console.log(`  Cached user: ${JSON.stringify(cachedUser)}`)

  yield* Console.log("\n=== All tests passed! ===");
});

// Run: bun run 00-mental-models/mental-models.practice.ts
Effect.runPromise(runTests);
