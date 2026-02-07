# Expense CRUD Practice Project

This mini-project puts together everything you've learned about Effect to build a complete expense management system.

## 🎯 Learning Goals

By completing this project, you will practice:

1. **Schema Design** - DB row vs input vs domain model
2. **Branded IDs** - Type-safe identifiers
3. **Service Interfaces** - Repository vs Service patterns
4. **Error Handling** - Tagged errors with catchTag
5. **Layer Composition** - Wiring it all together
6. **Testing** - With mock implementations

## 📁 Project Structure

```
expense-crud/
├── README.md           # You are here
├── domain/
│   ├── Expense.ts      # Expense schema and types
│   ├── Category.ts     # Category schema
│   └── Ids.ts          # Branded IDs (ExpenseId, CategoryId)
├── errors/
│   └── index.ts        # Domain errors (ExpenseNotFound, etc.)
├── repositories/
│   └── ExpenseRepository.ts  # Data access layer
├── services/
│   └── ExpenseService.ts     # Business logic
├── layers/
│   └── index.ts        # Layer composition
└── main.ts             # Entry point - ties it all together
```

## 🏃 How to Complete

### Step 1: Domain Layer (Start Here!)

Open `domain/Ids.ts` and implement:
- `ExpenseId` - branded string ID
- `CategoryId` - branded string ID

Open `domain/Category.ts` and implement:
- `Category` schema with id, name, icon fields

Open `domain/Expense.ts` and implement:
- `ExpenseRow` - what's stored in DB
- `CreateExpenseInput` - what API receives
- `Expense` - domain model with computed fields

### Step 2: Error Layer

Open `errors/index.ts` and implement:
- `ExpenseNotFound` error
- `CategoryNotFound` error
- `InvalidExpenseData` error

### Step 3: Repository Layer

Open `repositories/ExpenseRepository.ts` and implement:
- `ExpenseRepository` interface with CRUD methods
- `InMemoryExpenseRepository` implementation

### Step 4: Service Layer

Open `services/ExpenseService.ts` and implement:
- `ExpenseService` interface with business methods
- Business logic (validation, enrichment)

### Step 5: Wire It Up

Open `layers/index.ts` and:
- Compose layers
- Create the full application layer

Open `main.ts` and:
- Create sample data
- Run CRUD operations
- Handle errors properly

## ✅ Checklist

- [ ] Created branded IDs that can't be mixed up
- [ ] Designed schemas with appropriate fields for each context
- [ ] Created tagged errors with helpful messages
- [ ] Repository has no business logic (just data access)
- [ ] Service has business logic and uses repository
- [ ] Layers are properly composed
- [ ] main.ts demonstrates all CRUD operations
- [ ] Error handling uses catchTag appropriately

## 💡 Hints

### Schema Design Hints

**ExpenseRow (DB):**
```typescript
{
  id: ExpenseId
  categoryId: CategoryId
  amount: number          // Store as cents/smallest unit
  description: string
  date: Date
  createdAt: Date
  updatedAt: Date
}
```

**CreateExpenseInput (API):**
```typescript
{
  categoryId: CategoryId
  amount: number
  description: string
  date?: Date             // Optional, defaults to now
}
```

**Expense (Domain):**
```typescript
{
  ...ExpenseRow,
  category: Category      // Enriched with full category
  formattedAmount: string // "$10.00"
}
```

### Repository vs Service

**Repository should:**
- Have `create`, `findById`, `findAll`, `update`, `delete`
- Just do CRUD, no business logic
- Work with `ExpenseRow`

**Service should:**
- Have `createExpense`, `getExpense`, `listExpenses`, `deleteExpense`
- Validate input
- Enrich domain objects (add category to expense)
- Work with `Expense` (enriched domain model)

### Error Handling

```typescript
// In service, handle repository errors:
yield* expenseRepo.findById(id).pipe(
  Effect.catchTag("ExpenseNotFound", () =>
    Effect.fail(new ExpenseNotFound({ id }))
  )
)
```

## 🎓 When You're Done

1. Run `bun run typecheck` to verify types
2. Run `bun run projects/expense-crud/main.ts` to see it work
3. Try adding a new feature (e.g., expense tags, search)
4. Compare your solution to the SpendLore API code

Good luck! 🚀
