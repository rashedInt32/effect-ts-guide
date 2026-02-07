/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * @effect/platform - FILESYSTEM REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * @effect/platform provides cross-platform APIs including filesystem operations.
 * Use @effect/platform-node for Node.js/Bun runtime.
 *
 * WHY @effect/platform?
 * - Effect-native filesystem operations
 * - Proper error handling
 * - Resource management (automatic cleanup)
 * - Platform-agnostic (same API for Node, Bun, browser)
 *
 * REAL EXAMPLE: api/src/migrate.ts (reading SQL files)
 *
 * DOCS: https://effect.website/docs/platform
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { FileSystem } from "@effect/platform"
import { NodeFileSystem } from "@effect/platform-node"
import { Effect, Layer } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Basic Setup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FileSystem service requires a platform-specific layer.
 * For Node.js/Bun, use NodeFileSystem.layer.
 */

// The FileSystem service
// Access via: yield* FileSystem.FileSystem

// Platform layer for Node.js/Bun
const fsLayer = NodeFileSystem.layer

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Reading Files
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fs.readFileString(path) - Read file as UTF-8 string
 * fs.readFile(path) - Read file as Uint8Array
 */

const readTextFile = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const content = yield* fs.readFileString(path)
    return content
  })

// Read and parse JSON
const readJsonFile = <T>(path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const content = yield* fs.readFileString(path)
    return JSON.parse(content) as T
  })

// Read binary file
const readBinaryFile = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const bytes = yield* fs.readFile(path)
    return bytes
  })

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: Writing Files
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fs.writeFileString(path, content) - Write string as UTF-8
 * fs.writeFile(path, bytes) - Write binary data
 */

const writeTextFile = (path: string, content: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.writeFileString(path, content)
  })

// Write JSON with pretty printing
const writeJsonFile = (path: string, data: unknown) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const content = JSON.stringify(data, null, 2)
    yield* fs.writeFileString(path, content)
  })

// Append to file
const appendToFile = (path: string, content: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const existing = yield* fs.readFileString(path).pipe(
      Effect.catchTag("SystemError", () => Effect.succeed(""))
    )
    yield* fs.writeFileString(path, existing + content)
  })

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: Directory Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fs.readDirectory(path) - List directory contents
 * fs.makeDirectory(path) - Create directory
 * fs.exists(path) - Check if path exists
 */

const listDirectory = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const entries = yield* fs.readDirectory(path)
    return entries
  })

// List with file info
const listWithDetails = (dirPath: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const entries = yield* fs.readDirectory(dirPath)

    const details = yield* Effect.forEach(entries, (entry) =>
      Effect.gen(function* () {
        const fullPath = `${dirPath}/${entry}`
        const stat = yield* fs.stat(fullPath)
        return {
          name: entry,
          isDirectory: stat.type === "Directory",
          size: stat.size,
          modifiedAt: stat.mtime,
        }
      })
    )

    return details
  })

// Create directory (recursive)
const ensureDirectory = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory(path, { recursive: true })
  })

// Check existence
const fileExists = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    return yield* fs.exists(path)
  })

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: File Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fs.copy(src, dest) - Copy file or directory
 * fs.move(src, dest) - Move/rename file or directory
 * fs.remove(path) - Delete file or directory
 */

const copyFile = (src: string, dest: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.copy(src, dest)
  })

const moveFile = (src: string, dest: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.rename(src, dest)
  })

const deleteFile = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.remove(path)
  })

// Delete directory recursively
const deleteDirectory = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* fs.remove(path, { recursive: true })
  })

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: Temp Files and Scoped Resources
// ─────────────────────────────────────────────────────────────────────────────

/**
 * fs.makeTempDirectoryScoped() - Create temp directory, auto-cleanup
 * fs.makeTempFileScoped() - Create temp file, auto-cleanup
 *
 * These are scoped resources - they're cleaned up when the scope closes.
 */

const workWithTempDir = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem

  // Create temp directory - will be deleted when scope ends
  const tempDir = yield* fs.makeTempDirectoryScoped()

  yield* Effect.logInfo(`Using temp directory: ${tempDir}`)

  // Write some files
  yield* fs.writeFileString(`${tempDir}/data.txt`, "Hello, world!")
  yield* fs.writeFileString(`${tempDir}/config.json`, '{"key": "value"}')

  // Read back
  const data = yield* fs.readFileString(`${tempDir}/data.txt`)

  return data
}).pipe(Effect.scoped) // Important! Scope manages cleanup

// Temp file example
const workWithTempFile = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem

  // Create temp file - auto-deleted when scope ends
  const tempFile = yield* fs.makeTempFileScoped()

  yield* fs.writeFileString(tempFile, "Temporary content")
  const content = yield* fs.readFileString(tempFile)

  return content
}).pipe(Effect.scoped)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: Real-World Example - Migration Runner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read all SQL migration files from a directory.
 * Based on api/src/migrate.ts
 */

interface MigrationFile {
  name: string
  path: string
  content: string
}

const loadMigrations = (migrationsDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    // Check directory exists
    const exists = yield* fs.exists(migrationsDir)
    if (!exists) {
      yield* Effect.logWarning(`Migrations directory not found: ${migrationsDir}`)
      return []
    }

    // List all .sql files
    const files = yield* fs.readDirectory(migrationsDir)
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort()

    yield* Effect.logInfo(`Found ${sqlFiles.length} migration files`)

    // Load each file
    const migrations = yield* Effect.forEach(
      sqlFiles,
      (filename) =>
        Effect.gen(function* () {
          const path = `${migrationsDir}/${filename}`
          const content = yield* fs.readFileString(path)

          return {
            name: filename.replace(".sql", ""),
            path,
            content,
          } satisfies MigrationFile
        }),
      { concurrency: 5 } // Load 5 files at a time
    )

    return migrations
  })

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: Config File Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Common pattern: Read config file with fallback to defaults
 */

interface AppConfig {
  port: number
  host: string
  debug: boolean
}

const defaultConfig: AppConfig = {
  port: 3000,
  host: "localhost",
  debug: false,
}

const loadConfig = (configPath: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    const exists = yield* fs.exists(configPath)
    if (!exists) {
      yield* Effect.logInfo("Config file not found, using defaults")
      return defaultConfig
    }

    const content = yield* fs.readFileString(configPath)
    const config = JSON.parse(content) as Partial<AppConfig>

    return {
      ...defaultConfig,
      ...config,
    }
  })

const saveConfig = (configPath: string, config: AppConfig) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    // Ensure directory exists
    const dir = configPath.substring(0, configPath.lastIndexOf("/"))
    yield* fs.makeDirectory(dir, { recursive: true }).pipe(
      Effect.catchTag("SystemError", () => Effect.void)
    )

    yield* fs.writeFileString(configPath, JSON.stringify(config, null, 2))
    yield* Effect.logInfo(`Config saved to ${configPath}`)
  })

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: Complete Example
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A complete example: File-based logging service
 */

const createFileLogger = (logDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    // Ensure log directory exists
    yield* fs.makeDirectory(logDir, { recursive: true }).pipe(
      Effect.catchTag("SystemError", () => Effect.void)
    )

    const getLogPath = () => {
      const date = new Date().toISOString().split("T")[0]
      return `${logDir}/${date}.log`
    }

    const log = (level: string, message: string) =>
      Effect.gen(function* () {
        const timestamp = new Date().toISOString()
        const entry = `[${timestamp}] [${level}] ${message}\n`
        const logPath = getLogPath()

        // Read existing content (or empty string if file doesn't exist)
        const existing = yield* fs.readFileString(logPath).pipe(
          Effect.catchTag("SystemError", () => Effect.succeed(""))
        )

        // Append new entry
        yield* fs.writeFileString(logPath, existing + entry)
      })

    return {
      info: (msg: string) => log("INFO", msg),
      warn: (msg: string) => log("WARN", msg),
      error: (msg: string) => log("ERROR", msg),
    }
  })

// Usage example
const main = Effect.gen(function* () {
  yield* Effect.logInfo("=== FileSystem Demo ===")

  // Create a temp directory for our work
  const fs = yield* FileSystem.FileSystem
  const tempDir = yield* fs.makeTempDirectoryScoped()

  // Create a file logger
  const logger = yield* createFileLogger(`${tempDir}/logs`)

  yield* logger.info("Application started")
  yield* logger.warn("This is a warning")
  yield* logger.error("This is an error")

  // List what we created
  const entries = yield* fs.readDirectory(`${tempDir}/logs`)
  yield* Effect.logInfo(`Log files: ${entries.join(", ")}`)

  // Read one of the logs
  if (entries.length > 0) {
    const content = yield* fs.readFileString(`${tempDir}/logs/${entries[0]}`)
    yield* Effect.logInfo("Log content:\n" + content)
  }
}).pipe(Effect.scoped, Effect.provide(NodeFileSystem.layer))

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10: What NOT to Do (Anti-Patterns)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DON'T: Use Node.js fs directly
 */

// WRONG - not Effect-native, no proper error handling
// import * as fs from "node:fs"
// const content = fs.readFileSync("file.txt", "utf-8")

// CORRECT - Effect-native
// const content = yield* fs.readFileString("file.txt")

/**
 * DON'T: Forget to provide the platform layer
 */

// WRONG - will fail with missing service
// Effect.runPromise(readTextFile("file.txt"))

// CORRECT - provide the layer
// Effect.runPromise(readTextFile("file.txt").pipe(
//   Effect.provide(NodeFileSystem.layer)
// ))

/**
 * DON'T: Forget to scope temp resources
 */

// WRONG - temp file won't be cleaned up
// const tempFile = yield* fs.makeTempFileScoped()

// CORRECT - use scoped
// Effect.scoped(Effect.gen(function* () {
//   const tempFile = yield* fs.makeTempFileScoped()
//   // ... work with temp file
// }))

export {
  // Section 1: Setup
  fsLayer,

  // Section 2-3: Read/Write
  readTextFile,
  readJsonFile,
  writeTextFile,
  writeJsonFile,
  appendToFile,

  // Section 4: Directories
  listDirectory,
  listWithDetails,
  ensureDirectory,
  fileExists,

  // Section 5: File operations
  copyFile,
  moveFile,
  deleteFile,
  deleteDirectory,

  // Section 6: Temp resources
  workWithTempDir,
  workWithTempFile,

  // Section 7: Migrations
  loadMigrations,

  // Section 8: Config
  loadConfig,
  saveConfig,

  // Section 9: Complete example
  createFileLogger,
  main,
}
