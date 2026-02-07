/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * @effect/platform - FILESYSTEM PRACTICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Complete these exercises to master Effect filesystem operations.
 * Reference: ./platform-filesystem.reference.ts
 *
 * Run with: bun run 07-platform-filesystem/platform-filesystem.practice.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { FileSystem } from "@effect/platform"
import { NodeFileSystem } from "@effect/platform-node"
import { Effect } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1: Basic File Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create these file operation functions.
 *
 * 1. readFile - Read a text file and return its content
 * 2. writeFile - Write content to a text file
 * 3. copyFile - Copy a file from src to dest
 * 4. deleteFile - Delete a file
 */

// const readFile = (path: string) =>
//   Effect.gen(function* () {
//     const fs = yield* FileSystem.FileSystem
//     ???
//   })

// const writeFile = (path: string, content: string) =>
//   Effect.gen(function* () {
//     ???
//   })

// const copyFile = (src: string, dest: string) =>
//   Effect.gen(function* () {
//     ???
//   })

// const deleteFile = (path: string) =>
//   Effect.gen(function* () {
//     ???
//   })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2: Directory Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create directory operation functions.
 *
 * 1. listFiles - List all files in a directory (just names)
 * 2. listFilesRecursive - List all files recursively (full paths)
 * 3. createDirectory - Create a directory (recursive)
 * 4. deleteDirectory - Delete a directory and all its contents
 */

// const listFiles = (dirPath: string) =>
//   Effect.gen(function* () {
//     ???
//   })

// const listFilesRecursive = (dirPath: string): Effect.Effect<string[], ???, FileSystem.FileSystem> =>
//   Effect.gen(function* () {
//     const fs = yield* FileSystem.FileSystem
//     const entries = yield* fs.readDirectory(dirPath)
//
//     const results: string[] = []
//     for (const entry of entries) {
//       const fullPath = `${dirPath}/${entry}`
//       const stat = yield* fs.stat(fullPath)
//
//       if (stat.type === "Directory") {
//         // Recursively list subdirectory
//         ???
//       } else {
//         results.push(fullPath)
//       }
//     }
//     return results
//   })

// const createDirectory = (path: string) => ???

// const deleteDirectory = (path: string) => ???

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3: JSON File Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create JSON file helpers.
 *
 * 1. readJson<T> - Read and parse a JSON file
 * 2. writeJson - Write an object as pretty-printed JSON
 * 3. updateJson<T> - Read, modify, and write back JSON
 */

// const readJson = <T>(path: string) =>
//   Effect.gen(function* () {
//     ???
//   })

// const writeJson = (path: string, data: unknown) =>
//   Effect.gen(function* () {
//     ???
//   })

// const updateJson = <T>(path: string, updater: (data: T) => T) =>
//   Effect.gen(function* () {
//     ???
//   })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4: File Search
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a function to find files by pattern.
 *
 * findFiles should:
 * 1. Search a directory recursively
 * 2. Return paths of files matching the pattern (e.g., "*.ts", "*.json")
 * 3. Support simple glob patterns (* matches any characters)
 */

// const matchesPattern = (filename: string, pattern: string): boolean => {
//   // Convert glob pattern to regex
//   // e.g., "*.ts" -> /^.*\.ts$/
//   ???
// }

// const findFiles = (dirPath: string, pattern: string) =>
//   Effect.gen(function* () {
//     ???
//   })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5: Temp Directory Work
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a function that works with temp files.
 *
 * processWithTemp should:
 * 1. Create a temp directory (auto-cleanup)
 * 2. Copy input files to temp directory
 * 3. Run the provided processor function
 * 4. Return the result (temp dir is cleaned up after)
 */

// const processWithTemp = <T>(
//   inputFiles: string[],
//   processor: (tempDir: string, files: string[]) => Effect.Effect<T, ???, FileSystem.FileSystem>
// ) =>
//   Effect.gen(function* () {
//     const fs = yield* FileSystem.FileSystem
//
//     // Create temp directory (scoped)
//     const tempDir = yield* fs.makeTempDirectoryScoped()
//
//     // Copy input files to temp
//     ???
//
//     // Run processor
//     const result = yield* processor(tempDir, ???)
//
//     return result
//   }).pipe(Effect.scoped)

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 6: Simple File Logger
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a file-based logger.
 *
 * createLogger should return an object with:
 * - log(message): Append message with timestamp to log file
 * - clear(): Clear the log file
 * - read(): Read all log entries
 */

// interface LogEntry {
//   timestamp: string
//   message: string
// }

// const createLogger = (logPath: string) =>
//   Effect.gen(function* () {
//     const fs = yield* FileSystem.FileSystem
//
//     const log = (message: string) =>
//       Effect.gen(function* () {
//         ???
//       })
//
//     const clear = () =>
//       Effect.gen(function* () {
//         ???
//       })
//
//     const read = () =>
//       Effect.gen(function* () {
//         ???
//       })
//
//     return { log, clear, read }
//   })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 7: Migration File Loader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a migration file loader similar to the SpendLore example.
 *
 * loadMigrations should:
 * 1. Read all .sql files from a directory
 * 2. Sort them by name (001_, 002_, etc.)
 * 3. Return array of { name, content } objects
 */

// interface Migration {
//   name: string
//   content: string
// }

// const loadMigrations = (migrationsDir: string) =>
//   Effect.gen(function* () {
//     ???
//   })

// ─────────────────────────────────────────────────────────────────────────────
// TEST YOUR SOLUTIONS
// ─────────────────────────────────────────────────────────────────────────────

const main = Effect.gen(function* () {
  yield* Effect.logInfo("=== FileSystem Practice ===")

  const fs = yield* FileSystem.FileSystem

  // Create a temp directory for testing
  const tempDir = yield* fs.makeTempDirectoryScoped()
  yield* Effect.logInfo(`Using temp directory: ${tempDir}`)

  // Exercise 1: Test basic file operations
  // yield* writeFile(`${tempDir}/test.txt`, "Hello, World!")
  // const content = yield* readFile(`${tempDir}/test.txt`)
  // yield* Effect.logInfo(`Read content: ${content}`)

  // Exercise 2: Test directory operations
  // yield* createDirectory(`${tempDir}/subdir`)
  // yield* writeFile(`${tempDir}/subdir/file1.txt`, "File 1")
  // yield* writeFile(`${tempDir}/subdir/file2.txt`, "File 2")
  // const files = yield* listFiles(`${tempDir}/subdir`)
  // yield* Effect.logInfo(`Files: ${files.join(", ")}`)

  // Exercise 3: Test JSON operations
  // yield* writeJson(`${tempDir}/config.json`, { name: "Test", value: 42 })
  // const config = yield* readJson<{ name: string; value: number }>(`${tempDir}/config.json`)
  // yield* Effect.logInfo(`Config: ${JSON.stringify(config)}`)

  // Exercise 6: Test logger
  // const logger = yield* createLogger(`${tempDir}/app.log`)
  // yield* logger.log("Application started")
  // yield* logger.log("Processing data")
  // const entries = yield* logger.read()
  // yield* Effect.logInfo(`Log entries: ${entries.length}`)

  yield* Effect.logInfo("All exercises completed!")
}).pipe(Effect.scoped, Effect.provide(NodeFileSystem.layer))

// Uncomment to run:
// Effect.runPromise(main).catch(console.error)

export { main }
