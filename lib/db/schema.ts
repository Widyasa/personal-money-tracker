import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"
import { relations, sql } from "drizzle-orm"

// ─── Income Categories ───────────────────────────────────────────
export const incomeCategories = sqliteTable("income_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

// ─── Expense Categories ──────────────────────────────────────────
export const expenseCategories = sqliteTable("expense_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

// ─── Incomes ─────────────────────────────────────────────────────
export const incomes = sqliteTable("incomes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => incomeCategories.id, { onDelete: "restrict" }),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  note: text("note"),
  imageUrl: text("image_url"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

// ─── Expenses ────────────────────────────────────────────────────
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => expenseCategories.id, { onDelete: "restrict" }),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  note: text("note"),
  imageUrl: text("image_url"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

// ─── Debts ───────────────────────────────────────────────────────
export const debts = sqliteTable("debts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  totalAmount: real("total_amount").notNull(),
  remainingAmount: real("remaining_amount").notNull(),
  status: text("status", { enum: ["UNPAID", "PAID"] })
    .notNull()
    .default("UNPAID"),
  notes: text("notes"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

// ─── Debt Payments ───────────────────────────────────────────────
export const debtPayments = sqliteTable("debt_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  debtId: integer("debt_id")
    .notNull()
    .references(() => debts.id, { onDelete: "cascade" }),
  expenseId: integer("expense_id")
    .notNull()
    .references(() => expenses.id, { onDelete: "restrict" }),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

// ─── Savings Accounts ────────────────────────────────────────────
export const savingsAccounts = sqliteTable("savings_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["CASH", "BANK", "ASSET"] })
    .notNull()
    .default("CASH"),
  balance: real("balance").notNull().default(0),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

// ─── Relations ───────────────────────────────────────────────────
export const incomeCategoriesRelations = relations(
  incomeCategories,
  ({ many }) => ({
    incomes: many(incomes),
  })
)

export const expenseCategoriesRelations = relations(
  expenseCategories,
  ({ many }) => ({
    expenses: many(expenses),
  })
)

export const incomesRelations = relations(incomes, ({ one }) => ({
  category: one(incomeCategories, {
    fields: [incomes.categoryId],
    references: [incomeCategories.id],
  }),
}))

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  debtPayments: many(debtPayments),
}))

export const debtsRelations = relations(debts, ({ many }) => ({
  payments: many(debtPayments),
}))

export const debtPaymentsRelations = relations(debtPayments, ({ one }) => ({
  debt: one(debts, {
    fields: [debtPayments.debtId],
    references: [debts.id],
  }),
  expense: one(expenses, {
    fields: [debtPayments.expenseId],
    references: [expenses.id],
  }),
}))
