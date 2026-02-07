/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ERROR HANDLING - PRACTICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Complete these exercises to master Effect error handling.
 * Reference: ./error-handling.reference.ts
 *
 * Run with: bun run 05-error-handling/error-handling.practice.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Effect, Match, Schema } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1: Create Domain Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create errors for a banking system.
 *
 * 1. AccountNotFound - with accountId (branded string)
 * 2. InsufficientBalance - with accountId, requested, available (numbers)
 * 3. TransferLimitExceeded - with amount, dailyLimit (numbers)
 * 4. AccountFrozen - with accountId, reason (string)
 */

// const AccountId = Schema.String.pipe(Schema.brand("AccountId"))
// type AccountId = typeof AccountId.Type

// class AccountNotFound extends Schema.TaggedError<AccountNotFound>()(
//   "AccountNotFound",
//   {
//     ???
//   }
// ) {}

// class InsufficientBalance extends Schema.TaggedError<InsufficientBalance>()(
//   ???
// ) {}

// class TransferLimitExceeded extends Schema.TaggedError<TransferLimitExceeded>()(
//   ???
// ) {}

// class AccountFrozen extends Schema.TaggedError<AccountFrozen>()(
//   ???
// ) {}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2: Create Functions that Return Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create these functions that can fail with appropriate errors.
 *
 * 1. getAccount(id: AccountId) - Returns account or AccountNotFound
 *    Accounts: { "acc-1": 1000, "acc-2": 500 } (id -> balance)
 *
 * 2. withdraw(id: AccountId, amount: number) - Returns new balance or
 *    AccountNotFound | InsufficientBalance | AccountFrozen
 *    Account "acc-2" is frozen
 *
 * 3. transfer(from: AccountId, to: AccountId, amount: number) -
 *    Returns success message or any of the above errors + TransferLimitExceeded
 *    Daily limit is 5000
 */

// const getAccount = Effect.fn("getAccount")(function* (id: AccountId) {
//   ???
// })

// const withdraw = Effect.fn("withdraw")(function* (id: AccountId, amount: number) {
//   ???
// })

// const transfer = Effect.fn("transfer")(function* (
//   from: AccountId,
//   to: AccountId,
//   amount: number
// ) {
//   ???
// })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3: Handle Specific Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create error handlers using catchTag and catchTags.
 *
 * 1. handleAccountNotFound - Catches AccountNotFound and returns 0 as balance
 * 2. handleWithdrawErrors - Handles all withdraw errors and returns an error message
 *    - AccountNotFound: "Account {id} does not exist"
 *    - InsufficientBalance: "Cannot withdraw {requested}, only {available} available"
 *    - AccountFrozen: "Account {id} is frozen: {reason}"
 */

// const handleAccountNotFound = (id: AccountId) =>
//   getAccount(id).pipe(
//     Effect.catchTag("AccountNotFound", (e) => ???)
//   )

// const handleWithdrawErrors = (id: AccountId, amount: number) =>
//   withdraw(id, amount).pipe(
//     Effect.catchTags({
//       ???
//     })
//   )

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 4: Map Errors to API Responses
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create an ApiResponse error and map domain errors to it.
 *
 * 1. Create HttpError with statusCode (number) and message (string)
 *
 * 2. Create mapToHttpError that transforms transfer errors to HttpError:
 *    - AccountNotFound: 404
 *    - InsufficientBalance: 400
 *    - TransferLimitExceeded: 400
 *    - AccountFrozen: 403
 */

// class HttpError extends Schema.TaggedError<HttpError>()("HttpError", {
//   ???
// }) {}

// const mapToHttpError = (from: AccountId, to: AccountId, amount: number) =>
//   transfer(from, to, amount).pipe(
//     Effect.mapError((error) => ???)
//   )

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 5: Pattern Match on Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Create a function that pattern matches on all banking errors.
 *
 * Use Match.valueTags to create formatBankError that returns a user-friendly string.
 */

// type BankError = AccountNotFound | InsufficientBalance | TransferLimitExceeded | AccountFrozen

// const formatBankError = (error: BankError): string =>
//   Match.valueTags(error, {
//     ???
//   })

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 6: Complete Banking Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Build a complete banking service with proper error handling.
 *
 * 1. Create a BankService with methods:
 *    - getBalance(id: AccountId): Effect<number, AccountNotFound>
 *    - deposit(id: AccountId, amount: number): Effect<number, AccountNotFound>
 *    - withdraw(id: AccountId, amount: number): Effect<number, AccountNotFound | InsufficientBalance | AccountFrozen>
 *    - transfer(from: AccountId, to: AccountId, amount: number): Effect<string, BankError>
 *
 * 2. Create a demo program that:
 *    - Gets balance for acc-1
 *    - Deposits 200 to acc-1
 *    - Transfers 500 from acc-1 to acc-2 (should fail - acc-2 frozen)
 *    - Handles the error and logs a friendly message
 */

// const bankDemo = Effect.gen(function* () {
//   ???
// })

// ─────────────────────────────────────────────────────────────────────────────
// TEST YOUR SOLUTIONS
// ─────────────────────────────────────────────────────────────────────────────

const main = Effect.gen(function* () {
  yield* Effect.logInfo("=== Error Handling Practice ===")

  // Exercise 1: Test error creation
  // const accId = AccountId.make("acc-123")
  // const notFoundErr = AccountNotFound.make({ accountId: accId })
  // yield* Effect.logInfo(`Error tag: ${notFoundErr._tag}`)

  // Exercise 2: Test functions that error
  // const balance = yield* getAccount(AccountId.make("acc-1"))
  // yield* Effect.logInfo(`Balance: ${balance}`)

  // const missingAccount = yield* getAccount(AccountId.make("missing")).pipe(
  //   Effect.catchTag("AccountNotFound", (e) =>
  //     Effect.succeed(`Account ${e.accountId} not found`)
  //   )
  // )
  // yield* Effect.logInfo(missingAccount)

  // Exercise 3: Test error handlers
  // const handled = yield* handleAccountNotFound(AccountId.make("missing"))
  // yield* Effect.logInfo(`Handled balance: ${handled}`)

  // Exercise 4: Test HTTP error mapping
  // const httpResult = yield* mapToHttpError(
  //   AccountId.make("acc-1"),
  //   AccountId.make("acc-2"),
  //   100
  // ).pipe(
  //   Effect.catchTag("HttpError", (e) =>
  //     Effect.succeed(`HTTP ${e.statusCode}: ${e.message}`)
  //   )
  // )
  // yield* Effect.logInfo(httpResult)

  // Exercise 5: Test pattern matching
  // const error = InsufficientBalance.make({
  //   accountId: AccountId.make("acc-1"),
  //   requested: 1000,
  //   available: 500,
  // })
  // yield* Effect.logInfo(formatBankError(error))

  // Exercise 6: Run bank demo
  // yield* bankDemo

  yield* Effect.logInfo("All exercises completed!")
})

// Uncomment to run:
// Effect.runPromise(main).catch(console.error)

export { main }
