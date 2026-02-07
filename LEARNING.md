# Effect TypeScript Learning Guide

Welcome to the Effect learning materials for SpendLore! This folder contains hands-on examples and practice files to help you master Effect TypeScript patterns.

## 🎯 Purpose

This is a **learning-first** folder. Instead of just reading documentation, you'll:

1. **Read** the `*.reference.ts` files to understand patterns
2. **Practice** by writing your own code in `*.practice.ts` files
3. **Compare** your solutions with the reference
4. **Apply** what you learned in the actual SpendLore codebase

## 📁 Folder Structure

```
learning/
├── LEARNING.md                         # You are here
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
│
├── 00-mental-models/                   # ⭐ START HERE - Foundational concepts
│   ├── mental-models.reference.ts      # Containers, map vs flatMap, Promise translation
│   └── mental-models.practice.ts       # Your practice
│
├── 01-effect-basics/                   # Core Effect patterns
│   ├── effect-basics.reference.ts      # Effect.gen, Effect.fn, pipe, runners
│   └── effect-basics.practice.ts       # Your practice
│
├── 02-schema/                          # Data modeling & validation
│   ├── schema.reference.ts             # Schema.Class, brands, validation
│   └── schema.practice.ts
│
├── 03-config/                          # Configuration loading
│   ├── config.reference.ts             # Config primitives, defaults, secrets
│   └── config.practice.ts
│
├── 04-services-and-layers/             # Dependency injection
│   ├── services-layers.reference.ts    # Context.Tag, Layer composition
│   └── services-layers.practice.ts
│
├── 05-error-handling/                  # Typed errors
│   ├── errors.reference.ts             # TaggedError, catchTag, defects
│   └── errors.practice.ts
│
├── 06-sql-pg/                          # PostgreSQL database
│   ├── sql-pg.reference.ts             # PgClient, queries, transactions
│   └── sql-pg.practice.ts
│
├── 07-platform-filesystem/             # File system operations
│   ├── filesystem.reference.ts         # Read, write, directories
│   └── filesystem.practice.ts
│
├── 08-testing/                         # Testing Effect code
│   ├── testing.reference.ts            # @effect/vitest, test layers
│   └── testing.practice.ts
│
└── 09-advanced-patterns/               # ⭐ Advanced real-world patterns
    ├── advanced-patterns.reference.ts  # Concurrency, Resources, Ref, Schedule, Streams
    └── advanced-patterns.practice.ts
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd learning
bun install
```

### 2. Run Examples

```bash
# Run a specific file
bun run 01-effect-basics/effect-basics.reference.ts

# Type check all files
bun run typecheck
```

### 3. Learning Flow

For each topic:

1. **Read** the `.reference.ts` file completely
2. **Understand** each section and example
3. **Write** your own implementation in `.practice.ts`
4. **Run** your practice file to verify it works
5. **Compare** with reference, note differences

---

## 📚 Learning Path (Recommended Order)

Follow this order - each topic builds on previous ones:

| # | Topic | Prerequisites | Time | Status |
|---|-------|---------------|------|--------|
| 00 | **Mental Models** | TypeScript, Promises | 1-2 hrs | ⬜ |
| 01 | **Effect Basics** | 00 | 2-3 hrs | ⬜ |
| 02 | **Schema** | 01 | 2-3 hrs | ⬜ |
| 03 | **Config** | 01, 02 | 1-2 hrs | ⬜ |
| 04 | **Services & Layers** | 01, 02 | 3-4 hrs | ⬜ |
| 05 | **Error Handling** | 01, 02 | 2-3 hrs | ⬜ |
| 06 | **SQL (PostgreSQL)** | 01, 03, 04 | 2-3 hrs | ⬜ |
| 07 | **Platform FileSystem** | 01, 04 | 1-2 hrs | ⬜ |
| 08 | **Testing** | All above | 2-3 hrs | ⬜ |
| 09 | **Advanced Patterns** | 01-05 | 3-4 hrs | ⬜ |

**Status Legend:** ⬜ Not started | 🟡 In progress | ✅ Completed

---

## 🔗 SpendLore Cross-Reference

See these patterns in action in the actual codebase:

| Topic | SpendLore Files |
|-------|-----------------|
| Effect Basics | `api/src/migrate.ts` |
| Schema | `api/src/Domain/Ids.ts` |
| Config | `api/src/Layers/DatabaseLayer.ts` |
| Services & Layers | `api/src/Services/*.ts` (coming soon) |
| Error Handling | `api/src/Errors/*.ts` (coming soon) |
| SQL | `api/src/Repositories/*.ts` (coming soon) |
| FileSystem | `api/src/migrate.ts` |
| Testing | `api/tests/*.ts` (coming soon) |

---

## 📖 Official Documentation Links

### Core Effect

- [Effect Documentation](https://effect.website/docs/introduction)
- [Effect API Reference](https://effect-ts.github.io/effect/)
- [Effect GitHub](https://github.com/Effect-TS/effect)

### By Topic

| Topic | Official Docs |
|-------|---------------|
| Effect Basics | [Getting Started](https://effect.website/docs/getting-started/introduction) |
| Schema | [Schema Guide](https://effect.website/docs/guides/schema/introduction) |
| Config | [Configuration](https://effect.website/docs/guides/configuration) |
| Services & Layers | [Context & Layers](https://effect.website/docs/guides/context-management/introduction) |
| Error Handling | [Error Management](https://effect.website/docs/guides/error-management/introduction) |
| SQL | [@effect/sql Docs](https://github.com/Effect-TS/effect/tree/main/packages/sql) |
| Platform | [@effect/platform Docs](https://github.com/Effect-TS/effect/tree/main/packages/platform) |
| Testing | [Testing Guide](https://effect.website/docs/guides/testing/introduction) |
| Concurrency | [Basic Concurrency](https://effect.website/docs/concurrency/basic-concurrency) |
| Resources | [Resource Management](https://effect.website/docs/resource-management/scope) |
| State (Ref) | [State Management](https://effect.website/docs/state-management/ref) |
| Streams | [Stream Introduction](https://effect.website/docs/stream/introduction) |

### Effect Solutions CLI

Quick reference from the terminal:

```bash
# List all topics
~/.bun/bin/effect-solutions list

# Read a specific topic
~/.bun/bin/effect-solutions show basics
~/.bun/bin/effect-solutions show config
~/.bun/bin/effect-solutions show services-and-layers
~/.bun/bin/effect-solutions show error-handling
~/.bun/bin/effect-solutions show testing
```

---

## 🏆 Challenges

After completing each topic, try these challenges to solidify your understanding:

### Challenge 1: CLI Counter (After Topics 01-03)

Build a simple CLI that:
- Reads `INITIAL_COUNT` from environment (default: 0)
- Increments and logs the count 5 times
- Uses `Effect.gen` and `Config`

### Challenge 2: User Service (After Topics 01-05)

Create a `Users` service that:
- Has `create`, `findById`, `delete` methods
- Uses `Schema.Class` for the User model
- Has `UserNotFound` and `EmailExists` errors
- Includes a test layer with in-memory storage

### Challenge 3: File Logger (After Topics 01-07)

Build a logger service that:
- Writes logs to a file using `FileSystem`
- Reads log level from `Config`
- Has `info`, `warn`, `error` methods
- Handles file errors gracefully

### Challenge 4: Mini Migration Runner (After All Topics)

Create a simplified migration runner that:
- Reads SQL files from a directory
- Tracks executed migrations in a Map (no DB)
- Has proper error handling
- Includes tests with `@effect/vitest`

---

## 💡 Tips for Learning

1. **Type the code yourself** - Don't copy/paste. Typing builds muscle memory.

2. **Read error messages** - Effect's type errors are verbose but informative. They tell you exactly what's wrong.

3. **Use the language service** - Hover over types in your editor to see what Effect infers.

4. **Run frequently** - Don't write 100 lines then run. Write 5-10, run, verify, continue.

5. **Compare patterns** - When you see multiple ways to do something, understand when to use each.

6. **Check the source** - Effect's source code is well-written TypeScript. Reading it helps.

---

## 🔄 Progress Tracking

Update this section as you complete topics:

```
[ ] 00 - Mental Models (START HERE!)
    [ ] Read reference file - understand containers, map vs flatMap, Promise translation
    [ ] Complete practice file
    [ ] Can explain when to use Option vs Either vs Effect

[ ] 01 - Effect Basics
    [ ] Read reference file
    [ ] Complete practice file
    [ ] Understand all patterns

[ ] 02 - Schema
    [ ] Read reference file
    [ ] Complete practice file
    [ ] Understand all patterns

[ ] 03 - Config
    [ ] Read reference file
    [ ] Complete practice file
    [ ] Understand all patterns

[ ] 04 - Services & Layers
    [ ] Read reference file
    [ ] Complete practice file
    [ ] Understand all patterns

[ ] 05 - Error Handling
    [ ] Read reference file
    [ ] Complete practice file
    [ ] Understand all patterns

[ ] 06 - SQL (PostgreSQL)
    [ ] Read reference file
    [ ] Complete practice file
    [ ] Understand all patterns

[ ] 07 - Platform FileSystem
    [ ] Read reference file
    [ ] Complete practice file
    [ ] Understand all patterns

[ ] 08 - Testing
    [ ] Read reference file
    [ ] Complete practice file
    [ ] Understand all patterns

[ ] 09 - Advanced Patterns
    [ ] Read reference file - concurrency, resources, Ref, Schedule, Streams
    [ ] Complete practice file
    [ ] Can explain Effect.gen vs pipe tradeoffs
    [ ] Can use Ref for concurrent-safe state
    [ ] Can create safe resources with acquireRelease

[ ] Challenges
    [ ] Challenge 1: CLI Counter
    [ ] Challenge 2: User Service
    [ ] Challenge 3: File Logger
    [ ] Challenge 4: Mini Migration Runner
```

---

Happy learning! 🎉
