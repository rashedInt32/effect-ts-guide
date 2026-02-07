/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EFFECT BASICS - PRACTICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Practice writing Effect patterns. Reference: effect-basics.reference.ts
 *
 * INSTRUCTIONS:
 * 1. Read the reference file first
 * 2. Implement each section below
 * 3. Run this file: bun run 01-effect-basics/effect-basics.practice.ts
 * 4. Compare your solutions with the reference
 *
 * TIP: Delete the `// TODO` comments as you implement each part
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Effect } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE 1: Creating Effects
// ─────────────────────────────────────────────────────────────────────────────

// TODO: Create an effect that succeeds with the number 100
const mySucceed = undefined

// TODO: Create an effect that fails with the string "Not found"
const myFail = undefined

// TODO: Create an effect that wraps Date.now() using Effect.sync
const mySync = undefined

// TODO: Create an effect that parses JSON and handles potential errors
const myTry = undefined

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE 2: Effect.gen
// ─────────────────────────────────────────────────────────────────────────────

// TODO: Create an Effect.gen that:
// 1. Gets two numbers (10 and 5)
// 2. Logs "Calculating..."
// 3. Returns their product (50)
const myGen = undefined

// TODO: Create an Effect.gen with a loop that:
// 1. Starts with sum = 0
// 2. Loops from 1 to 10
// 3. Logs each number
// 4. Returns the sum (55)
const myLoop = undefined

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE 3: Effect.fn
// ─────────────────────────────────────────────────────────────────────────────

// TODO: Create a named function "greet" that:
// - Takes a name (string)
// - Logs "Hello, {name}!"
// - Returns the greeting string
const greet = undefined

// TODO: Create a named function "safeDivide" that:
// - Takes two numbers (a, b)
// - Fails with "Cannot divide by zero" if b is 0
// - Returns a / b otherwise
const safeDivide = undefined

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE 4: Transforming Effects
// ─────────────────────────────────────────────────────────────────────────────

// TODO: Start with Effect.succeed(5) and use pipe to:
// 1. Double it (10)
// 2. Add 3 (13)
// 3. Convert to string "Result: 13"
const myPipe = undefined

// TODO: Create an effect that:
// 1. Succeeds with 42
// 2. Taps to log the value
// 3. Maps to double it
// 4. Returns 84
const myTransform = undefined

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE 5: Combining Effects
// ─────────────────────────────────────────────────────────────────────────────

// TODO: Use Effect.all to run these three effects and get [1, 2, 3]
const myAll = undefined

// TODO: Use Effect.forEach to double each number in [1, 2, 3, 4, 5]
// and log each result
const myForEach = undefined

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE 6: Complete Exercise
// ─────────────────────────────────────────────────────────────────────────────

// TODO: Build a simple "calculator" program that:
//
// 1. Define validateNumber(n: unknown) using Effect.fn
//    - Fails with "Invalid number" if n is not a number
//    - Returns the number if valid
//
// 2. Define calculate(a: number, b: number, op: "add" | "sub" | "mul" | "div")
//    - Uses Effect.fn
//    - Performs the operation
//    - Fails with "Division by zero" for div when b is 0
//    - Logs the operation being performed
//
// 3. Define main that:
//    - Validates two numbers
//    - Calculates their sum
//    - Logs the result
//    - Returns the result

const validateNumber = undefined
const calculate = undefined
const calculatorMain = undefined

// ─────────────────────────────────────────────────────────────────────────────
// Run your practice code
// ─────────────────────────────────────────────────────────────────────────────

// Uncomment to test your implementations:
// Effect.runPromise(myGen).then(console.log)
// Effect.runPromise(calculatorMain).then(console.log)
