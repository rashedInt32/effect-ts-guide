/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EFFECT CONFIG - REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Effect's Config module provides type-safe configuration loading with
 * validation, defaults, and secret handling.
 *
 * HOW IT WORKS:
 * - By default, Config reads from environment variables
 * - You can override with ConfigProvider for tests/different sources
 * - Best practice: Create config services with layers
 *
 * REAL EXAMPLE: api/src/Layers/DatabaseLayer.ts
 *
 * DOCS: https://effect.website/docs/configuration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Config, ConfigProvider, Context, Effect, Layer, Redacted, Schema } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Basic Config Primitives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Config primitives read from environment variables by default.
 * Each Config returns an Effect that reads the value.
 */

// String config
const getHost = Config.string("HOST")

// Integer config
const getPort = Config.integer("PORT")

// Boolean config
const getDebug = Config.boolean("DEBUG")

// Number (float) config
const getTimeout = Config.number("TIMEOUT")

// URL config
const getApiUrl = Config.url("API_URL")

/**
 * Using config in a program
 */
const basicConfigExample = Effect.gen(function* () {
  // Each yield* reads from environment
  const host = yield* Config.string("HOST")
  const port = yield* Config.integer("PORT")

  yield* Effect.logInfo(`Server: ${host}:${port}`)
  return { host, port }
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Defaults and Fallbacks - MULTIPLE APPROACHES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║ THREE WAYS TO PROVIDE DEFAULT VALUES                                       ║
 * ║                                                                           ║
 * ║ Effect provides multiple APIs for defaults. Understanding when to use    ║
 * ║ each helps you write cleaner, more intentional code.                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ┌─────────────────────────────────────────────────────────────────────────────
// │ APPROACH 1: Config.withDefault (RECOMMENDED for simple defaults)
// │
// │ USE WHEN: You have a static default value
// │ BENEFIT: Most concise, clearly expresses intent
// └─────────────────────────────────────────────────────────────────────────────

const portWithDefault = Config.integer("PORT").pipe(Config.withDefault(3000))

const hostWithDefault = Config.string("HOST").pipe(Config.withDefault("localhost"))

const debugWithDefault = Config.boolean("DEBUG").pipe(Config.withDefault(false))

// ┌─────────────────────────────────────────────────────────────────────────────
// │ APPROACH 2: Config.orElse (For computed/dynamic defaults)
// │
// │ USE WHEN: Default needs to be computed, or you want to try another Config
// │ BENEFIT: Can chain multiple config sources, lazy evaluation
// └─────────────────────────────────────────────────────────────────────────────

// Simple fallback to a value (same as withDefault, but more verbose)
const portWithOrElse = Config.integer("PORT").pipe(
  Config.orElse(() => Config.succeed(3000))
)

// Try multiple config keys in order (orElse shines here!)
const hostWithFallbackKeys = Config.string("APP_HOST").pipe(
  Config.orElse(() => Config.string("HOST")), // Try HOST if APP_HOST missing
  Config.orElse(() => Config.succeed("localhost")) // Final fallback
)

// Dynamic default based on another config
const apiUrlWithDynamicDefault = Config.string("API_URL").pipe(
  Config.orElse(() =>
    Config.string("NODE_ENV").pipe(
      Config.map((env) =>
        env === "production"
          ? "https://api.production.com"
          : "http://localhost:3000"
      )
    )
  )
)

// ┌─────────────────────────────────────────────────────────────────────────────
// │ APPROACH 3: Config.option (When absence is meaningful)
// │
// │ USE WHEN: Missing config is a valid state, not an error
// │ BENEFIT: Caller decides how to handle None
// └─────────────────────────────────────────────────────────────────────────────

import { Option } from "effect"

// Returns Option<boolean> - None if not set, Some(value) if set
const optionalFeatureFlag = Config.option(Config.boolean("FEATURE_FLAG"))

// Optional with explicit None handling
const useOptionalConfig = Effect.gen(function* () {
  const featureFlag = yield* optionalFeatureFlag

  // Pattern 1: Use Option.getOrElse for default
  const isEnabled = Option.getOrElse(featureFlag, () => false)

  // Pattern 2: Use Option.match for different behavior
  const message = Option.match(featureFlag, {
    onNone: () => "Feature flag not configured",
    onSome: (enabled) => `Feature flag is ${enabled ? "ON" : "OFF"}`,
  })

  return { isEnabled, message }
})

// ┌─────────────────────────────────────────────────────────────────────────────
// │ COMPARISON: Same Result, Different Approaches
// └─────────────────────────────────────────────────────────────────────────────

/**
 * All three of these are equivalent for simple defaults:
 */

// ✅ BEST - Most concise and clear intent
const port1 = Config.integer("PORT").pipe(Config.withDefault(3000))

// ⚠️ OK - More verbose, but works
const port2 = Config.integer("PORT").pipe(
  Config.orElse(() => Config.succeed(3000))
)

// ⚠️ OK - Option approach, requires extra handling
const port3 = Config.option(Config.integer("PORT")).pipe(
  Config.map(Option.getOrElse(() => 3000))
)

/**
 * RECOMMENDATION:
 * - Use `withDefault` for 90% of cases (simple static defaults)
 * - Use `orElse` when you need to try multiple sources or compute defaults
 * - Use `option` when missing config has semantic meaning in your domain
 */

/**
 * Using defaults in a program (demonstrating all approaches)
 */
const withDefaultsExample = Effect.gen(function* () {
  // withDefault - simple and clean
  const port = yield* Config.integer("PORT").pipe(Config.withDefault(3000))

  // orElse - trying multiple environment variable names
  const env = yield* Config.string("NODE_ENV").pipe(
    Config.orElse(() => Config.string("ENVIRONMENT")),
    Config.withDefault("development")
  )

  // option - when we need to know if it was explicitly set
  const debugMode = yield* Config.option(Config.boolean("DEBUG"))
  const isDebugExplicitlySet = Option.isSome(debugMode)

  return { port, env, debugMode, isDebugExplicitlySet }
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: Config Transformation - map, mapOrFail, validate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║ TRANSFORMING CONFIG VALUES                                                 ║
 * ║                                                                           ║
 * ║ Config values often need to be transformed or validated after reading.   ║
 * ║ Effect provides several operators for this.                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ┌─────────────────────────────────────────────────────────────────────────────
// │ Config.map - Transform value (cannot fail)
// │
// │ USE WHEN: Simple transformation that always succeeds
// └─────────────────────────────────────────────────────────────────────────────

// Convert to uppercase
const appName = Config.string("APP_NAME").pipe(
  Config.map((name) => name.toUpperCase())
)

// Parse comma-separated list
const allowedOrigins = Config.string("ALLOWED_ORIGINS").pipe(
  Config.map((s) => s.split(",").map((x) => x.trim()))
)

// ┌─────────────────────────────────────────────────────────────────────────────
// │ Config.mapOrFail - Transform with potential failure
// │
// │ USE WHEN: Transformation might fail (parsing, validation)
// │ NOTE: Prefer Schema.Config for complex validation
// └─────────────────────────────────────────────────────────────────────────────

import { ConfigError, Either } from "effect"

// Parse a URL (might fail)
const apiEndpoint = Config.string("API_ENDPOINT").pipe(
  Config.mapOrFail((s) => {
    try {
      return Either.right(new URL(s))
    } catch {
      return Either.left(ConfigError.InvalidData([], `Invalid URL: ${s}`))
    }
  })
)

// Parse JSON config
const featureFlags = Config.string("FEATURE_FLAGS").pipe(
  Config.mapOrFail((s) => {
    try {
      return Either.right(JSON.parse(s) as Record<string, boolean>)
    } catch {
      return Either.left(ConfigError.InvalidData([], `Invalid JSON: ${s}`))
    }
  }),
  Config.withDefault({})
)

// ┌─────────────────────────────────────────────────────────────────────────────
// │ Config.mapAttempt - Transform with exception handling
// │
// │ USE WHEN: Using code that throws exceptions
// │ BENEFIT: Automatically catches and converts to ConfigError
// └─────────────────────────────────────────────────────────────────────────────

// Simpler alternative to mapOrFail when function throws
const apiEndpointSimpler = Config.string("API_ENDPOINT").pipe(
  Config.mapAttempt((s) => new URL(s)) // Throws if invalid, auto-caught
)

// ┌─────────────────────────────────────────────────────────────────────────────
// │ Config.validate - Add validation predicate
// │
// │ USE WHEN: Value must satisfy a condition
// └─────────────────────────────────────────────────────────────────────────────

// Port must be in valid range
const validPort = Config.integer("PORT").pipe(
  Config.validate({
    message: "Port must be between 1 and 65535",
    validation: (port) => port >= 1 && port <= 65535,
  })
)

// String must not be empty
const requiredName = Config.string("APP_NAME").pipe(
  Config.validate({
    message: "APP_NAME cannot be empty",
    validation: (name) => name.length > 0,
  })
)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: Combining Configs - all, zip, nested
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║ COMBINING MULTIPLE CONFIGS                                                 ║
 * ║                                                                           ║
 * ║ Often you need to read multiple config values together.                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ┌─────────────────────────────────────────────────────────────────────────────
// │ Config.all - Combine multiple configs into tuple/struct
// │
// │ USE WHEN: Reading multiple configs at once
// └─────────────────────────────────────────────────────────────────────────────

// As an array (tuple)
const serverConfigTuple = Config.all([
  Config.string("HOST").pipe(Config.withDefault("localhost")),
  Config.integer("PORT").pipe(Config.withDefault(3000)),
])
// Type: Config<[string, number]>

// As an object (struct) - RECOMMENDED
const serverConfigStruct = Config.all({
  host: Config.string("HOST").pipe(Config.withDefault("localhost")),
  port: Config.integer("PORT").pipe(Config.withDefault(3000)),
  debug: Config.boolean("DEBUG").pipe(Config.withDefault(false)),
})
// Type: Config<{ host: string; port: number; debug: boolean }>

// ┌─────────────────────────────────────────────────────────────────────────────
// │ Config.zip / Config.zipWith - Combine two configs
// │
// │ USE WHEN: Combining exactly two configs with transformation
// └─────────────────────────────────────────────────────────────────────────────

// zip - returns tuple
const hostPort = Config.string("HOST").pipe(
  Config.zip(Config.integer("PORT"))
)
// Type: Config<[string, number]>

// zipWith - combine with function
const connectionString = Config.string("DB_HOST").pipe(
  Config.zipWith(Config.integer("DB_PORT"), (host, port) => `${host}:${port}`)
)
// Type: Config<string>

// ┌─────────────────────────────────────────────────────────────────────────────
// │ Config.nested - Group configs under a prefix
// │
// │ USE WHEN: Organizing configs by namespace (DB_, API_, AUTH_, etc.)
// └─────────────────────────────────────────────────────────────────────────────

// Instead of DB_HOST, DB_PORT, DB_NAME...
const dbConfig = Config.all({
  host: Config.string("HOST"),
  port: Config.integer("PORT"),
  name: Config.string("NAME"),
}).pipe(Config.nested("DB"))
// Reads from: DB_HOST, DB_PORT, DB_NAME

// Deeply nested
const awsConfig = Config.all({
  accessKey: Config.redacted("ACCESS_KEY"),
  secretKey: Config.redacted("SECRET_KEY"),
  region: Config.string("REGION").pipe(Config.withDefault("us-east-1")),
}).pipe(Config.nested("AWS"))
// Reads from: AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: Redacted - Handling Secrets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Config.redacted - For sensitive values like API keys, passwords
 *
 * BENEFITS:
 * - Redacted in logs (shows "<redacted>")
 * - Prevents accidental exposure
 * - Use Redacted.value() to extract the actual value
 */

const secretConfigExample = Effect.gen(function* () {
  // Read sensitive value as Redacted
  const apiKey = yield* Config.redacted("API_KEY")
  const dbPassword = yield* Config.redacted("DB_PASSWORD")

  // Logging shows <redacted>, not the actual value
  yield* Effect.logInfo(`API Key: ${apiKey}`) // Output: "API Key: <redacted>"

  // To use the actual value, unwrap with Redacted.value()
  const headers = {
    Authorization: `Bearer ${Redacted.value(apiKey)}`,
  }

  return headers
})

/**
 * Creating Redacted values manually (for tests)
 */
const testSecret = Redacted.make("my-secret-value")
console.log(`Secret: ${testSecret}`) // Output: "Secret: <redacted>"
console.log(`Actual: ${Redacted.value(testSecret)}`) // Output: "Actual: my-secret-value"

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: Schema.Config - Validated Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schema.Config(name, schema)
 *
 * RECOMMENDED: Use Schema for config validation instead of manual mapOrFail.
 *
 * BENEFITS:
 * - Automatic type inference
 * - Rich validation errors
 * - Reusable schemas
 * - Branded types for safety
 */

// Define reusable schemas
const Port = Schema.NumberFromString.pipe(
  Schema.int(),
  Schema.between(1, 65535),
  Schema.brand("Port")
)
type Port = typeof Port.Type

const Environment = Schema.Literal("development", "staging", "production")
type Environment = typeof Environment.Type

const LogLevel = Schema.Literal("debug", "info", "warn", "error")
type LogLevel = typeof LogLevel.Type

/**
 * Using Schema.Config
 */
const schemaConfigExample = Effect.gen(function* () {
  // Schema handles validation automatically
  const port = yield* Schema.Config("PORT", Port)
  const env = yield* Schema.Config("NODE_ENV", Environment)
  const logLevel = yield* Schema.Config("LOG_LEVEL", LogLevel).pipe(
    Config.orElse(() => Config.succeed("info" as const))
  )

  yield* Effect.logInfo(`Running in ${env} on port ${port}`)
  return { port, env, logLevel }
})

/**
 * Schema.Config with Redacted
 */
const RedactedString = Schema.Redacted(Schema.String)

const secretSchemaConfig = Effect.gen(function* () {
  const apiKey = yield* Schema.Config("API_KEY", RedactedString)
  return apiKey
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: Config Layers (Recommended Pattern)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BEST PRACTICE: Create config as a service with a layer.
 *
 * WHY?
 * - Separates config loading from business logic
 * - Easy to swap implementations (production vs test)
 * - Config errors caught early at layer composition
 * - Type-safe throughout your app
 */

// Define the config service
class AppConfig extends Context.Tag("@app/AppConfig")<
  AppConfig,
  {
    readonly port: number
    readonly environment: Environment
    readonly logLevel: LogLevel
    readonly jwtSecret: Redacted.Redacted
  }
>() {
  // Production layer - reads from environment
  // Using withDefault (RECOMMENDED) instead of orElse for simple defaults
  static readonly layer = Layer.effect(
    AppConfig,
    Effect.gen(function* () {
      const port = yield* Config.integer("PORT").pipe(Config.withDefault(3000))
      const environment = yield* Schema.Config("NODE_ENV", Environment).pipe(
        Config.withDefault("development" as const)
      )
      const logLevel = yield* Schema.Config("LOG_LEVEL", LogLevel).pipe(
        Config.withDefault("info" as const)
      )
      const jwtSecret = yield* Config.redacted("JWT_SECRET")

      return AppConfig.of({ port, environment, logLevel, jwtSecret })
    })
  )

  // Test layer - hardcoded values, no env vars needed
  static readonly testLayer = Layer.succeed(AppConfig, {
    port: 3000,
    environment: "development" as const,
    logLevel: "debug" as const,
    jwtSecret: Redacted.make("test-secret"),
  })
}

/**
 * Using the config service
 */
const useConfigService = Effect.gen(function* () {
  const config = yield* AppConfig

  yield* Effect.logInfo(`Port: ${config.port}`)
  yield* Effect.logInfo(`Environment: ${config.environment}`)

  // Use secret for actual operations
  const token = signJwt({ userId: "123" }, Redacted.value(config.jwtSecret))

  return token
})

// Helper function for the example
function signJwt(_payload: object, _secret: string): string {
  return "jwt-token"
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: Database Config Layer Example
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Real-world example: Database configuration
 */

class DatabaseConfig extends Context.Tag("@app/DatabaseConfig")<
  DatabaseConfig,
  {
    readonly host: string
    readonly port: number
    readonly database: string
    readonly username: string
    readonly password: Redacted.Redacted
    readonly poolSize: number
    readonly ssl: boolean
  }
>() {
  static readonly layer = Layer.effect(
    DatabaseConfig,
    Effect.gen(function* () {
      // Using withDefault for simple defaults
      const host = yield* Config.string("DB_HOST").pipe(
        Config.withDefault("localhost")
      )
      const port = yield* Config.integer("DB_PORT").pipe(
        Config.withDefault(5432)
      )
      const database = yield* Config.string("DB_NAME")
      const username = yield* Config.string("DB_USER")
      const password = yield* Config.redacted("DB_PASSWORD")
      const poolSize = yield* Config.integer("DB_POOL_SIZE").pipe(
        Config.withDefault(10)
      )
      const ssl = yield* Config.boolean("DB_SSL").pipe(
        Config.withDefault(false)
      )

      return DatabaseConfig.of({
        host,
        port,
        database,
        username,
        password,
        poolSize,
        ssl,
      })
    })
  )

  static readonly testLayer = Layer.succeed(DatabaseConfig, {
    host: "localhost",
    port: 5432,
    database: "test_db",
    username: "test_user",
    password: Redacted.make("test_password"),
    poolSize: 5,
    ssl: false,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: ConfigProvider - Changing Config Source
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ConfigProvider allows you to change WHERE config comes from.
 * Use Layer.setConfigProvider to override the default (env vars).
 */

// From a Map (useful for tests)
const testConfigProvider = ConfigProvider.fromMap(
  new Map([
    ["PORT", "3000"],
    ["NODE_ENV", "development"],
    ["API_KEY", "test-api-key"],
  ])
)

// From JSON
const jsonConfigProvider = ConfigProvider.fromJson({
  PORT: 8080,
  NODE_ENV: "production",
  API_KEY: "prod-api-key",
})

// With a prefix (reads APP_PORT, APP_NODE_ENV, etc.)
const prefixedProvider = ConfigProvider.fromEnv().pipe(
  ConfigProvider.nested("APP")
)

/**
 * Using a custom provider
 */
const withCustomProvider = Effect.gen(function* () {
  const port = yield* Config.integer("PORT")
  const env = yield* Config.string("NODE_ENV")
  return { port, env }
}).pipe(Effect.provide(Layer.setConfigProvider(testConfigProvider)))

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10: Complete Example
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete example: Application startup with layered config
 */

// API config service
class ApiConfig extends Context.Tag("@app/ApiConfig")<
  ApiConfig,
  {
    readonly baseUrl: string
    readonly timeout: number
    readonly apiKey: Redacted.Redacted
  }
>() {
  static readonly layer = Layer.effect(
    ApiConfig,
    Effect.gen(function* () {
      const baseUrl = yield* Config.string("API_BASE_URL").pipe(
        Config.withDefault("https://api.example.com")
      )
      const timeout = yield* Config.integer("API_TIMEOUT").pipe(
        Config.withDefault(30000)
      )
      const apiKey = yield* Config.redacted("API_KEY")

      return ApiConfig.of({ baseUrl, timeout, apiKey })
    })
  )
}

// Compose all configs
const configLayer = Layer.mergeAll(
  AppConfig.layer,
  DatabaseConfig.layer,
  ApiConfig.layer
)

// Use in your application
const startApp = Effect.gen(function* () {
  const app = yield* AppConfig
  const db = yield* DatabaseConfig
  const api = yield* ApiConfig

  yield* Effect.logInfo(`Starting ${app.environment} server on port ${app.port}`)
  yield* Effect.logInfo(`Database: ${db.host}:${db.port}/${db.database}`)
  yield* Effect.logInfo(`API: ${api.baseUrl}`)

  // Your app logic here...
})

// Entry point (provide all layers at once)
const main = startApp.pipe(Effect.provide(configLayer))

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11: What NOT to Do (Anti-Patterns)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DON'T: Read config inline throughout your code
 */

// WRONG - scattered config reads
// const badHandler = Effect.gen(function* () {
//   const port = yield* Config.integer("PORT")  // Config read deep in code
//   const key = yield* Config.redacted("API_KEY")  // Another read
//   // ... business logic ...
// })

// CORRECT - centralized config service
// const goodHandler = Effect.gen(function* () {
//   const config = yield* AppConfig  // One service access
//   // Use config.port, config.apiKey, etc.
// })

/**
 * DON'T: Expose secrets in logs or errors
 */

// WRONG - logging raw secret
// yield* Effect.logInfo(`Key: ${Redacted.value(secret)}`)

// CORRECT - Redacted auto-hides
// yield* Effect.logInfo(`Key: ${secret}`)  // Shows "<redacted>"

/**
 * DON'T: Use process.env directly
 */

// WRONG - loses type safety and validation
// const port = parseInt(process.env.PORT || "3000", 10)

// CORRECT - type-safe with validation
// const port = yield* Schema.Config("PORT", Port)

export {
  // Section 1: Primitives
  getHost,
  getPort,
  getDebug,
  getTimeout,
  getApiUrl,
  basicConfigExample,

  // Section 2: Defaults - Multiple Approaches
  portWithDefault,
  hostWithDefault,
  debugWithDefault,
  portWithOrElse,
  hostWithFallbackKeys,
  apiUrlWithDynamicDefault,
  optionalFeatureFlag,
  useOptionalConfig,
  port1,
  port2,
  port3,
  withDefaultsExample,

  // Section 3: Transformation
  appName,
  allowedOrigins,
  apiEndpoint,
  featureFlags,
  apiEndpointSimpler,
  validPort,
  requiredName,

  // Section 4: Combining Configs
  serverConfigTuple,
  serverConfigStruct,
  hostPort,
  connectionString,
  dbConfig,
  awsConfig,

  // Section 5: Redacted
  secretConfigExample,
  testSecret,

  // Section 6: Schema.Config
  Port,
  Environment,
  LogLevel,
  schemaConfigExample,

  // Section 7-8: Config Layers
  AppConfig,
  DatabaseConfig,
  useConfigService,

  // Section 9: ConfigProvider
  testConfigProvider,
  jsonConfigProvider,
  withCustomProvider,

  // Section 10: Complete example
  ApiConfig,
  configLayer,
  main,
}
