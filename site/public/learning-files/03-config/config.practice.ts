/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EFFECT CONFIG - PRACTICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Complete these exercises to master Effect Config.
 * Reference: ./config.reference.ts
 *
 * Run with: bun run 03-config/config.practice.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Config, Context, Effect, Layer, Redacted, Schema } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1: Basic Config Reading
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a program that reads the following config values:
 *
 * 1. SERVER_HOST (string, default: "0.0.0.0")
 * 2. SERVER_PORT (integer, default: 8080)
 * 3. DEBUG_MODE (boolean, default: false)
 *
 * Return an object with these values.
 */

// export const readBasicConfig = Effect.gen(function* () {
//   ???
// })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2: Schema-Validated Config
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create validated schemas and read config using Schema.Config.
 *
 * 1. PortNumber - Integer between 1 and 65535, branded as "PortNumber"
 * 2. AppEnvironment - Literal "local" | "dev" | "staging" | "prod"
 * 3. MaxConnections - Integer between 1 and 100
 *
 * Then create a program that reads:
 * - APP_PORT using PortNumber schema
 * - APP_ENV using AppEnvironment schema (default: "local")
 * - MAX_CONNECTIONS using MaxConnections schema (default: 10)
 */

// export const PortNumber = ???
// export type PortNumber = typeof PortNumber.Type

// export const AppEnvironment = ???
// export type AppEnvironment = typeof AppEnvironment.Type

// export const MaxConnections = ???
// export type MaxConnections = typeof MaxConnections.Type

// export const readValidatedConfig = Effect.gen(function* () {
//   ???
// })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3: Handling Secrets with Redacted
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a program that:
 *
 * 1. Reads DATABASE_URL as a redacted string
 * 2. Reads API_SECRET as a redacted string
 * 3. Logs both values (should show <redacted>)
 * 4. Creates a connection string using the actual DATABASE_URL value
 *
 * Return the connection string (for testing purposes).
 */

// export const readSecrets = Effect.gen(function* () {
//   ???
// })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4: Create a Config Service Layer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a RedisConfig service with a layer.
 *
 * Interface:
 * - host: string
 * - port: PortNumber (use your schema from Exercise 2)
 * - password: Redacted.Redacted (optional, use Config.option)
 * - db: number (0-15, default: 0)
 * - prefix: string (default: "app:")
 *
 * Create:
 * 1. The Context.Tag for RedisConfig
 * 2. A production layer that reads from env vars
 * 3. A test layer with hardcoded values
 */

// class RedisConfig extends Context.Tag("@app/RedisConfig")<
//   RedisConfig,
//   {
//     readonly host: string
//     readonly port: PortNumber
//     readonly password: ???
//     readonly db: number
//     readonly prefix: string
//   }
// >() {
//   static readonly layer = ???
//
//   static readonly testLayer = ???
// }

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5: Compose Multiple Config Services
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create an EmailConfig service and compose it with RedisConfig.
 *
 * EmailConfig interface:
 * - smtpHost: string
 * - smtpPort: PortNumber
 * - username: string
 * - password: Redacted.Redacted
 * - fromAddress: string
 *
 * Then:
 * 1. Create the EmailConfig service with layer and testLayer
 * 2. Create a combined configLayer that merges RedisConfig and EmailConfig
 * 3. Create a program that uses both configs and logs their settings
 */

// class EmailConfig extends Context.Tag("@app/EmailConfig")<
//   EmailConfig,
//   {
//     ???
//   }
// >() {
//   static readonly layer = ???
//   static readonly testLayer = ???
// }

// export const combinedConfigLayer = ???

// export const useAllConfigs = Effect.gen(function* () {
//   ???
// })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 6: Feature Flags Config
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a FeatureFlags service for toggling features.
 *
 * Interface:
 * - enableNewDashboard: boolean
 * - enableBetaFeatures: boolean
 * - maxUploadSizeMb: number
 * - allowedFileTypes: string[] (comma-separated in env var)
 *
 * Hint: For the array, use Config.array(Config.string(), "ENV_VAR_NAME")
 *
 * Create both layer and testLayer.
 */

// class FeatureFlags extends Context.Tag("@app/FeatureFlags")<
//   FeatureFlags,
//   {
//     ???
//   }
// >() {
//   static readonly layer = ???
//   static readonly testLayer = ???
// }

// ─────────────────────────────────────────────────────────────────────────────
// TEST YOUR SOLUTIONS
// ─────────────────────────────────────────────────────────────────────────────

const main = Effect.gen(function* () {
  yield* Effect.logInfo("=== Config Practice ===")

  // Note: Most exercises require environment variables to be set.
  // For testing, you can either:
  // 1. Set env vars before running
  // 2. Use the testLayer versions
  // 3. Use ConfigProvider.fromMap to mock values

  // Exercise 1: Test basic config (will use defaults if env vars not set)
  // const basic = yield* readBasicConfig
  // yield* Effect.logInfo(`Basic config: ${JSON.stringify(basic)}`)

  // Exercise 2: Test validated config (needs env vars or will use defaults)
  // const validated = yield* readValidatedConfig
  // yield* Effect.logInfo(`Validated config: ${JSON.stringify(validated)}`)

  // Exercise 4: Test RedisConfig with test layer
  // const redis = yield* RedisConfig
  // yield* Effect.logInfo(`Redis: ${redis.host}:${redis.port}`)

  // Exercise 5: Test combined configs
  // const result = yield* useAllConfigs.pipe(
  //   Effect.provide(combinedConfigLayer)
  // )

  // Exercise 6: Test feature flags
  // const features = yield* FeatureFlags
  // yield* Effect.logInfo(`New dashboard: ${features.enableNewDashboard}`)

  yield* Effect.logInfo("All exercises completed!")
})

// To test with mock config, wrap with a test provider:
// const testProvider = ConfigProvider.fromMap(new Map([
//   ["SERVER_HOST", "127.0.0.1"],
//   ["SERVER_PORT", "9000"],
//   ["DEBUG_MODE", "true"],
// ]))
// Effect.runPromise(main.pipe(Effect.provide(Layer.setConfigProvider(testProvider))))

// Uncomment to run with test layers:
// const testMain = main.pipe(
//   Effect.provide(RedisConfig.testLayer),
//   Effect.provide(EmailConfig.testLayer),
//   Effect.provide(FeatureFlags.testLayer),
// )
// Effect.runPromise(testMain).catch(console.error)

export { main }
