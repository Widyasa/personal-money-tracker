"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRightIcon, ArrowDownRightIcon, Loader2Icon } from "lucide-react";

type Transaction = {
  id: number;
  amount: number;
  date: string;
  note: string | null;
  categoryName: string | null;
  type: "income" | "expense";
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [incomesRes, expensesRes] = await Promise.all([
        fetch("/api/incomes"),
        fetch("/api/expenses"),
      ]);
      const incomesData = await incomesRes.json();
      const expensesData = await expensesRes.json();

      const combined: Transaction[] = [
        ...incomesData.map((i: Record<string, unknown>) => ({
          id: i.id,
          amount: i.amount,
          date: i.date,
          note: i.note,
          categoryName: i.categoryName,
          type: "income" as const,
        })),
        ...expensesData.map((e: Record<string, unknown>) => ({
          id: e.id,
          amount: e.amount,
          date: e.date,
          note: e.note,
          categoryName: e.categoryName,
          type: "expense" as const,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(combined);
      setLoading(false);
    }
    fetchData();
  }, []);

  function formatCurrency(val: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
  }

  // Group transactions by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transaksi</h1>
        <p className="text-muted-foreground">Timeline gabungan semua pemasukan dan pengeluaran</p>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">Belum ada transaksi</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([date, txs]) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {new Date(date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {txs.map((tx) => (
                  <div key={`${tx.type}-${tx.id}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-8 items-center justify-center rounded-lg ${
                          tx.type === "income" ? "bg-emerald-500/10" : "bg-rose-500/10"
                        }`}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpRightIcon className="size-4 text-emerald-500" />
                        ) : (
                          <ArrowDownRightIcon className="size-4 text-rose-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {tx.note || tx.categoryName || (tx.type === "income" ? "Pemasukan" : "Pengeluaran")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.categoryName} · {tx.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        tx.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
