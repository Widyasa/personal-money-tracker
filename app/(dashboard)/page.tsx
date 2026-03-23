"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  WalletIcon,
  HandCoinsIcon,
  PiggyBankIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

type ChartDataPoint = { label: string; income: number; expense: number };
type SavingsBreakdown = { type: string; total: number; count: number };
type Transaction = {
  id: number;
  amount: number;
  date: string;
  note: string | null;
  type: "income" | "expense";
};

type DashboardData = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalUnpaidDebt: number;
  unpaidDebtCount: number;
  totalSavings: number;
  savingsBreakdown: SavingsBreakdown[];
  recentTransactions: Transaction[];
  chartData: ChartDataPoint[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [chartFilter, setChartFilter] = useState<"daily" | "monthly" | "yearly">("monthly");
  const chartFilterLabel: Record<"daily" | "monthly" | "yearly", string> = {
    daily: "Harian",
    monthly: "Bulanan",
    yearly: "Tahunan",
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const month = formatMonth(currentMonth);
    const res = await fetch(`/api/dashboard/summary?month=${month}&chart=${chartFilter}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [currentMonth, chartFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function prevMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Ringkasan kondisi keuangan Anda</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border p-1">
          <Button size="icon" variant="ghost" className="size-8" onClick={prevMonth}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {formatMonthLabel(currentMonth)}
          </span>
          <Button size="icon" variant="ghost" className="size-8" onClick={nextMonth}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards — per month */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pemasukan</CardTitle>
            <TrendingUpIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran</CardTitle>
            <TrendingDownIcon className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(data.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <WalletIcon className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.balance >= 0 ? "text-sky-600 dark:text-sky-400" : "text-rose-600 dark:text-rose-400"}`}>
              {formatCurrency(data.balance)}
            </div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utang Belum Lunas</CardTitle>
            <HandCoinsIcon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(data.totalUnpaidDebt)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.unpaidDebtCount} aktif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expense Chart */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Pemasukan vs Pengeluaran</CardTitle>
          <div className="flex gap-1 rounded-lg border p-1">
            {(["daily", "monthly", "yearly"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={chartFilter === f ? "default" : "ghost"}
                className="h-7 px-3 text-xs capitalize"
                onClick={() => setChartFilter(f)}
              >
                {chartFilterLabel[f]}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {data.chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    interval={chartFilter === "daily" ? 4 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) => {
                      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                      return String(v);
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada transaksi bulan ini</p>
            ) : (
              <div className="space-y-3">
                {data.recentTransactions.map((tx) => (
                  <div key={`${tx.type}-${tx.id}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-8 items-center justify-center rounded-lg ${tx.type === "income" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                        {tx.type === "income" ? (
                          <ArrowUpRightIcon className="size-4 text-emerald-500" />
                        ) : (
                          <ArrowDownRightIcon className="size-4 text-rose-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.note || (tx.type === "income" ? "Pemasukan" : "Pengeluaran")}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Savings Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PiggyBankIcon className="size-4" />
              Distribusi Tabungan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-2xl font-bold">
              {formatCurrency(data.totalSavings)}
            </div>
            {data.savingsBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada akun tabungan</p>
            ) : (
              <div className="space-y-3">
                {data.savingsBreakdown.map((item) => {
                  const percentage = data.totalSavings > 0 ? (item.total / data.totalSavings) * 100 : 0;
                  const colorMap: Record<string, string> = {
                    CASH: "bg-emerald-500",
                    BANK: "bg-sky-500",
                    ASSET: "bg-amber-500",
                  };
                  return (
                    <div key={item.type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.type}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(item.total)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${colorMap[item.type] || "bg-primary"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
