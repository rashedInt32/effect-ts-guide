/**
 * =============================================================================
 * EXPENSE CRUD - MAIN ENTRY POINT
 * =============================================================================
 *
 * This file ties everything together and demonstrates the full CRUD flow.
 *
 * Run with: bun run projects/expense-crud/main.ts
 *
 * =============================================================================
 */

import { Console, Effect } from "effect"
import { sampleCategories } from "./domain/Category.js"
import { CreateExpenseInput } from "./domain/Expense.js"
import { ExpenseService, AppLayer } from "./layers/index.js"

// =============================================================================
// MAIN PROGRAM
// =============================================================================

const program = Effect.gen(function* () {
  // Get the ExpenseService from context
  const expenseService = yield* ExpenseService

  yield* Console.log("=".repeat(60))
  yield* Console.log("EXPENSE CRUD DEMO")
  yield* Console.log("=".repeat(60))

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1: Show available categories
  // ─────────────────────────────────────────────────────────────────────────

  yield* Console.log("\n📁 Available Categories:")
  for (const cat of sampleCategories) {
    yield* Console.log(`   ${cat.icon} ${cat.name} (${cat.id})`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2: CREATE - Add some expenses
  // ─────────────────────────────────────────────────────────────────────────

  yield* Console.log("\n📝 Creating expenses...")

  const foodCategory = sampleCategories[0]! // Food & Dining
  const transportCategory = sampleCategories[1]! // Transportation

  // Create first expense
  const expense1 = yield* expenseService.createExpense(
    new CreateExpenseInput({
      categoryId: foodCategory.id,
      amount: 1250, // $12.50
      description: "Lunch at cafe",
    })
  )
  yield* Console.log(`   ✅ Created: ${expense1.description} - ${expense1.formattedAmount}`)

  // Create second expense
  const expense2 = yield* expenseService.createExpense(
    new CreateExpenseInput({
      categoryId: transportCategory.id,
      amount: 3500, // $35.00
      description: "Uber to airport",
    })
  )
  yield* Console.log(`   ✅ Created: ${expense2.description} - ${expense2.formattedAmount}`)

  // Create third expense
  const expense3 = yield* expenseService.createExpense(
    new CreateExpenseInput({
      categoryId: foodCategory.id,
      amount: 850, // $8.50
      description: "Coffee and pastry",
    })
  )
  yield* Console.log(`   ✅ Created: ${expense3.description} - ${expense3.formattedAmount}`)

  // ─────────────────────────────────────────────────────────────────────────
  // Step 3: READ - List all expenses
  // ─────────────────────────────────────────────────────────────────────────

  yield* Console.log("\n📋 All expenses:")
  const allExpenses = yield* expenseService.listExpenses()
  for (const exp of allExpenses) {
    yield* Console.log(
      `   ${exp.category.icon} ${exp.formattedAmount} - ${exp.description} (${exp.category.name})`
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Step 4: READ - Get single expense
  // ─────────────────────────────────────────────────────────────────────────

  yield* Console.log("\n🔍 Getting single expense:")
  const singleExpense = yield* expenseService.getExpense(expense1.id)
  yield* Console.log(`   Found: ${singleExpense.description}`)
  yield* Console.log(`   Amount: ${singleExpense.formattedAmount}`)
  yield* Console.log(`   Category: ${singleExpense.category.icon} ${singleExpense.category.name}`)
  yield* Console.log(`   Date: ${singleExpense.date.toLocaleDateString()}`)

  // ─────────────────────────────────────────────────────────────────────────
  // Step 5: READ - Filter by category
  // ─────────────────────────────────────────────────────────────────────────

  yield* Console.log("\n🍔 Food expenses only:")
  const foodExpenses = yield* expenseService.listByCategory(foodCategory.id)
  const foodTotal = foodExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  for (const exp of foodExpenses) {
    yield* Console.log(`   ${exp.formattedAmount} - ${exp.description}`)
  }
  yield* Console.log(`   Total: $${(foodTotal / 100).toFixed(2)}`)

  // ─────────────────────────────────────────────────────────────────────────
  // Step 6: DELETE - Remove an expense
  // ─────────────────────────────────────────────────────────────────────────

  yield* Console.log("\n🗑️  Deleting expense...")
  yield* expenseService.deleteExpense(expense2.id)
  yield* Console.log(`   ✅ Deleted: ${expense2.description}`)

  // Verify deletion
  const remainingExpenses = yield* expenseService.listExpenses()
  yield* Console.log(`\n📋 Remaining expenses (${remainingExpenses.length}):`)
  for (const exp of remainingExpenses) {
    yield* Console.log(`   ${exp.category.icon} ${exp.formattedAmount} - ${exp.description}`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Step 7: ERROR HANDLING - Try to get deleted expense
  // ─────────────────────────────────────────────────────────────────────────

  yield* Console.log("\n⚠️  Trying to get deleted expense...")
  yield* expenseService.getExpense(expense2.id).pipe(
    Effect.tap((exp) => Console.log(`   Found: ${exp.description}`)),
    Effect.catchTag("ExpenseNotFound", (error) =>
      Console.log(`   ❌ Error: ${error.message} (id: ${error.id})`)
    )
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Step 8: VALIDATION ERROR - Try invalid input
  // ─────────────────────────────────────────────────────────────────────────

  yield* Console.log("\n⚠️  Trying to create with invalid data...")
  yield* expenseService
    .createExpense(
      new CreateExpenseInput({
        categoryId: foodCategory.id,
        amount: -100, // Invalid! Negative amount
        description: "This should fail",
      })
    )
    .pipe(
      Effect.tap((exp) => Console.log(`   Created: ${exp.description}`)),
      Effect.catchTag("InvalidExpenseData", (error) =>
        Console.log(`   ❌ Validation error: ${error.field} - ${error.reason}`)
      )
    )

  yield* Console.log("\n" + "=".repeat(60))
  yield* Console.log("DEMO COMPLETE!")
  yield* Console.log("=".repeat(60))
})

// =============================================================================
// RUN THE PROGRAM
// =============================================================================

/**
 * Provide the AppLayer and run!
 *
 * This is the ONLY place where we "run" the effect.
 * Everything else is pure composition.
 */
const main = program.pipe(Effect.provide(AppLayer))

Effect.runPromise(main).catch(console.error)
