# My Effect TypeScript Learning Journey

This is my personal repository for learning [Effect](https://effect.website/) - a powerful TypeScript library that I've been wanting to dive deeper into.

## Why I'm Learning Effect

I've been hearing great things about Effect's approach to handling side effects, error handling, and composition in TypeScript. After dealing with enough `try/catch` spaghetti and callback hell in production code, I decided to invest time in understanding this "Effect" paradigm properly.

## What I'm Documenting Here

This repo is essentially my learning notes, experiments, and reference implementations. I'm organizing it as I go, treating it like a structured course I'm building for myself.

### My Learning Notes

- **Mental Models** - How I think about Effect concepts (still evolving!)
- **Effect Basics** - The building blocks: Effect.gen, Effect.fn, pipe, transformations
- **Schema** - Data validation and modeling (this is pretty cool)
- **Config** - Managing configuration properly
- **Services & Layers** - Finally understanding dependency injection
- **Error Handling** - Structured, typed errors instead of throwing
- **SQL/PostgreSQL** - Database stuff with @effect/sql
- **Platform & Filesystem** - File operations and platform abstractions
- **Testing** - How to test Effect code
- **Advanced Patterns** - Concurrency, resources, state management

### Projects I'm Building

- **Expense CRUD** - A mini-project to test my understanding with real patterns

## How I Use This Repo

```bash
# Install deps
bun install

# Make sure TypeScript is happy
bun run typecheck

# Run a reference file to see concepts in action
bun run 00-mental-models/mental-models.reference.ts

# Do practice exercises
bun run 00-mental-models/mental-models.practice.ts
```

## My Learning Path

This is roughly the order I'm working through things:

1. `00-mental-models/` - Getting the core mental model down
2. `01-effect-basics/` - Learning the syntax and primitives
3. `02-schema/` through `05-error-handling/` - Building up the toolkit
4. `projects/expense-crud/` - Actually building something real
5. `09-advanced-patterns/` - The fancy stuff

## Tech I'm Using

- **Effect** v3.19.x - The library I'm learning
- **TypeScript** - Because types make everything better
- **Bun** - Fast runtime, works great with Effect

## Key "Aha" Moments So Far

- **Effects as Recipes** - They're descriptions, not executions. Nothing happens until you run it.
- **Type Safety** - The compiler tracks errors and dependencies. No more surprise runtime errors.
- **Composability** - You can build complex flows from small, testable pieces.
- **Lazy Evaluation** - Effects don't run until explicitly executed with `Effect.runPromise` or similar.

## Notes for Future Me

This is a living document. As I learn more, I'll update these files. Some sections might be rough or incomplete - that's okay, this is a work in progress!

If you stumbled upon this repo and find it useful, feel free to use it for your own learning. But keep in mind this reflects *my* understanding (or lack thereof) at various points in time.

## Resources I've Found Helpful

- [Effect Documentation](https://effect.website/docs) - The official docs
- [Effect GitHub](https://github.com/Effect-TS/effect) - Source code
- [Effect Discord](https://discord.gg/effect-ts) - Community is super helpful

---

*Learning in public, one Effect at a time*
