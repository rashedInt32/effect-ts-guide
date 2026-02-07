/**
 * =============================================================================
 * CATEGORY SCHEMA - PRACTICE
 * =============================================================================
 *
 * Categories help organize expenses (Food, Transport, Entertainment, etc.)
 *
 * TASK: Implement the Category schema using Schema.Class
 *
 * =============================================================================
 */

import { Schema } from "effect"
import { CategoryId } from "./Ids.js"

// =============================================================================
// EXERCISE: Create Category Schema
// =============================================================================

/**
 * TODO: Create a Category class using Schema.Class
 *
 * Fields:
 * - id: CategoryId (required)
 * - name: string (required, e.g., "Food", "Transport")
 * - icon: string (optional, e.g., "🍔", "🚗")
 * - color: string (optional, e.g., "#FF5733")
 *
 * HINT:
 *   export class Category extends Schema.Class<Category>("Category")({
 *     id: CategoryId,
 *     name: Schema.String,
 *     ...
 *   }) {}
 */

// Uncomment and implement:
// export class Category extends Schema.Class<Category>("Category")({
//   ???
// }) {}

// =============================================================================
// SOLUTION
// =============================================================================

export class Category extends Schema.Class<Category>("Category")({
  id: CategoryId,
  name: Schema.String,
  icon: Schema.optionalWith(Schema.String, { default: () => "📦" }),
  color: Schema.optionalWith(Schema.String, { default: () => "#6B7280" }),
}) {}

// =============================================================================
// SAMPLE DATA (for testing)
// =============================================================================

import { generateCategoryId } from "./Ids.js"

export const sampleCategories: Category[] = [
  new Category({
    id: generateCategoryId(),
    name: "Food & Dining",
    icon: "🍔",
    color: "#F59E0B",
  }),
  new Category({
    id: generateCategoryId(),
    name: "Transportation",
    icon: "🚗",
    color: "#3B82F6",
  }),
  new Category({
    id: generateCategoryId(),
    name: "Entertainment",
    icon: "🎬",
    color: "#8B5CF6",
  }),
  new Category({
    id: generateCategoryId(),
    name: "Utilities",
    icon: "💡",
    color: "#10B981",
  }),
]
