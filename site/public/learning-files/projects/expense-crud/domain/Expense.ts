/**
 * =============================================================================
 * EXPENSE SCHEMA - PRACTICE
 * =============================================================================
 *
 * This is the main domain model. We'll create THREE schemas:
 *
 * 1. ExpenseRow - What's stored in the database
 * 2. CreateExpenseInput - What the API receives
 * 3. Expense - The enriched domain model
 *
 * TASK: Implement all three schemas
 *
 * =============================================================================
 */

import { Schema } from "effect"
import { ExpenseId, CategoryId } from "./Ids.js"
import { Category } from "./Category.js"

// =============================================================================
// EXERCISE 1: ExpenseRow (Database Schema)
// =============================================================================

/**
 * TODO: Create ExpenseRow - represents what's stored in the database
 *
 * Fields:
 * - id: ExpenseId
 * - categoryId: CategoryId
 * - amount: number (in cents, e.g., 1050 = $10.50)
 * - description: string
 * - date: Date (when the expense occurred)
 * - createdAt: Date
 * - updatedAt: Date
 */

// Uncomment and implement:
// export class ExpenseRow extends Schema.Class<ExpenseRow>("ExpenseRow")({
//   ???
// }) {}

// =============================================================================
// EXERCISE 2: CreateExpenseInput (API Input Schema)
// =============================================================================

/**
 * TODO: Create CreateExpenseInput - what clients send to create an expense
 *
 * Fields:
 * - categoryId: CategoryId (required)
 * - amount: number (required)
 * - description: string (required)
 * - date: Date (optional, defaults to now)
 *
 * Note: No id, createdAt, updatedAt - server generates those
 */

// Uncomment and implement:
// export class CreateExpenseInput extends Schema.Class<CreateExpenseInput>("CreateExpenseInput")({
//   ???
// }) {}

// =============================================================================
// EXERCISE 3: Expense (Domain Model)
// =============================================================================

/**
 * TODO: Create Expense - the enriched domain model
 *
 * This extends ExpenseRow with:
 * - category: Category (the full category object, not just ID)
 * - formattedAmount: string (e.g., "$10.50")
 *
 * HINT: You can use Schema.extend or just define all fields
 */

// Uncomment and implement:
// export class Expense extends Schema.Class<Expense>("Expense")({
//   ???
// }) {}

// =============================================================================
// SOLUTION
// =============================================================================

export class ExpenseRow extends Schema.Class<ExpenseRow>("ExpenseRow")({
  id: ExpenseId,
  categoryId: CategoryId,
  amount: Schema.Number, // In cents
  description: Schema.String,
  date: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}

export class CreateExpenseInput extends Schema.Class<CreateExpenseInput>("CreateExpenseInput")({
  categoryId: CategoryId,
  amount: Schema.Number,
  description: Schema.String,
  date: Schema.optionalWith(Schema.Date, { default: () => new Date() }),
}) {}

export class Expense extends Schema.Class<Expense>("Expense")({
  // All fields from ExpenseRow
  id: ExpenseId,
  categoryId: CategoryId,
  amount: Schema.Number,
  description: Schema.String,
  date: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
  // Enriched fields
  category: Category,
  formattedAmount: Schema.String,
}) {}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format cents as currency string
 */
export const formatAmount = (cents: number): string => {
  const dollars = cents / 100
  return `$${dollars.toFixed(2)}`
}

/**
 * Convert ExpenseRow + Category to full Expense
 */
export const enrichExpense = (row: ExpenseRow, category: Category): Expense =>
  new Expense({
    ...row,
    category,
    formattedAmount: formatAmount(row.amount),
  })
