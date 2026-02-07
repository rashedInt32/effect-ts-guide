/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * @effect/sql-pg - PRACTICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Complete these exercises to master Effect SQL.
 * Reference: ./sql-pg.reference.ts
 *
 * Note: These exercises are conceptual - to run them you need a PostgreSQL database.
 * Focus on understanding the patterns.
 *
 * Run with: bun run 06-sql-pg/sql-pg.practice.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { SqlClient } from "@effect/sql"
import { Context, Effect, Layer, Schema } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1: Basic Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Write these database query functions.
 *
 * 1. getAllProducts - Returns all products (id, name, price, stock)
 * 2. getProductById - Returns a product by ID or null
 * 3. searchProducts - Search by name pattern with limit
 */

// const getAllProducts = Effect.gen(function* () {
//   const sql = yield* SqlClient.SqlClient
//   ???
// })

// const getProductById = (id: string) =>
//   Effect.gen(function* () {
//     const sql = yield* SqlClient.SqlClient
//     ???
//   })

// const searchProducts = (namePattern: string, limit: number) =>
//   Effect.gen(function* () {
//     const sql = yield* SqlClient.SqlClient
//     ???
//   })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2: INSERT, UPDATE, DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Write mutation functions.
 *
 * 1. createProduct - Insert and return the created product
 * 2. updateProductPrice - Update price and return updated product
 * 3. deleteProduct - Delete a product by ID
 */

// const createProduct = (name: string, price: number, stock: number) =>
//   Effect.gen(function* () {
//     const sql = yield* SqlClient.SqlClient
//     ???
//   })

// const updateProductPrice = (id: string, newPrice: number) =>
//   Effect.gen(function* () {
//     const sql = yield* SqlClient.SqlClient
//     ???
//   })

// const deleteProduct = (id: string) =>
//   Effect.gen(function* () {
//     const sql = yield* SqlClient.SqlClient
//     ???
//   })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3: Transactions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Write a transaction for order placement.
 *
 * placeOrder should atomically:
 * 1. Check product stock (fail if insufficient)
 * 2. Decrease product stock by quantity
 * 3. Create an order record
 * 4. Return the order ID
 *
 * If any step fails, all changes should be rolled back.
 */

// const placeOrder = (productId: string, quantity: number, customerId: string) =>
//   Effect.gen(function* () {
//     const sql = yield* SqlClient.SqlClient
//
//     yield* sql.withTransaction(
//       Effect.gen(function* () {
//         ???
//       })
//     )
//   })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4: Build a Repository
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a complete Product repository service.
 *
 * Domain:
 * - ProductId: branded string
 * - Product: { id, name, price, stock, createdAt }
 * - ProductNotFound error
 * - InsufficientStock error (with productId, requested, available)
 *
 * Interface:
 * - create(data): Effect<Product>
 * - findById(id): Effect<Product, ProductNotFound>
 * - updateStock(id, delta): Effect<Product, ProductNotFound | InsufficientStock>
 *   (delta can be negative for decreasing stock)
 * - list(): Effect<Product[]>
 *
 * Create both a layer (uses SqlClient) and testLayer (in-memory).
 */

// const ProductId = Schema.String.pipe(Schema.brand("ProductId"))
// type ProductId = typeof ProductId.Type

// class Product extends Schema.Class<Product>("Product")({
//   ???
// }) {}

// class ProductNotFound extends Schema.TaggedError<ProductNotFound>()(
//   "ProductNotFound",
//   { ??? }
// ) {}

// class InsufficientStock extends Schema.TaggedError<InsufficientStock>()(
//   "InsufficientStock",
//   { ??? }
// ) {}

// class ProductRepo extends Context.Tag("@app/ProductRepo")<
//   ProductRepo,
//   {
//     ???
//   }
// >() {
//   static readonly layer = ???
//   static readonly testLayer = ???
// }

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5: Order Service with Multiple Repos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create an OrderService that uses ProductRepo.
 *
 * Domain:
 * - OrderId: branded string
 * - Order: { id, productId, quantity, totalPrice, createdAt }
 *
 * Interface:
 * - create(productId, quantity): Effect<Order, ProductNotFound | InsufficientStock>
 *   Should:
 *   1. Get product from ProductRepo
 *   2. Check/update stock
 *   3. Calculate total price
 *   4. Create and return order
 *
 * - findById(id): Effect<Order, OrderNotFound>
 */

// class Orders extends Context.Tag("@app/Orders")<
//   Orders,
//   {
//     ???
//   }
// >() {
//   static readonly layer = ???
//   static readonly testLayer = ???
// }

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 6: Migration Script
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Write a migration script that:
 *
 * 1. Creates a products table (id, name, price, stock, created_at)
 * 2. Creates an orders table (id, product_id FK, quantity, total_price, created_at)
 * 3. Creates an index on orders.product_id
 */

// const createProductsTable = Effect.gen(function* () {
//   const sql = yield* SqlClient.SqlClient
//   yield* sql.unsafe(`
//     ???
//   `)
// })

// const createOrdersTable = Effect.gen(function* () {
//   const sql = yield* SqlClient.SqlClient
//   yield* sql.unsafe(`
//     ???
//   `)
// })

// const createIndexes = Effect.gen(function* () {
//   const sql = yield* SqlClient.SqlClient
//   ???
// })

// ─────────────────────────────────────────────────────────────────────────────
// TEST YOUR SOLUTIONS
// ─────────────────────────────────────────────────────────────────────────────

const main = Effect.gen(function* () {
  yield* Effect.logInfo("=== SQL-PG Practice ===")

  // Note: These exercises require a database connection.
  // For learning, focus on the patterns rather than running the code.

  // Exercise 4: Test ProductRepo with testLayer
  // const productRepo = yield* ProductRepo
  // const product = yield* productRepo.create({
  //   name: "Widget",
  //   price: 9.99,
  //   stock: 100,
  // })
  // yield* Effect.logInfo(`Created product: ${product.id}`)

  // Exercise 5: Test OrderService
  // const orders = yield* Orders
  // const order = yield* orders.create(product.id, 5)
  // yield* Effect.logInfo(`Created order: ${order.id}, total: ${order.totalPrice}`)

  yield* Effect.logInfo("All exercises completed!")
})

// Uncomment to run with test layers:
// const testLayer = ProductRepo.testLayer.pipe(
//   Layer.provideMerge(Orders.testLayer)
// )
// Effect.runPromise(main.pipe(Effect.provide(testLayer))).catch(console.error)

export { main }
