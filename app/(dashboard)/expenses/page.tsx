"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ImageIcon, Loader2Icon, Pencil, PlusIcon, SearchIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/currency-input";
import { CategoryCombobox } from "@/components/category-combobox";
import { ImageUpload } from "@/components/image-upload";
import type { DateRange } from "react-day-picker";

type Category = { id: number; name: string };
type Expense = {
  id: number;
  categoryId: number;
  categoryName: string | null;
  amount: number;
  date: string;
  note: string | null;
  imageUrl: string | null;
};
const PAGE_SIZE = 10;

function toDateKey(dateValue: Date) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<{ from?: string; to?: string }>({});
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [page, setPage] = useState(1);

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [image, setImage] = useState<File | null>(null);

  async function fetchData() {
    const [expRes, catsRes] = await Promise.all([
      fetch("/api/expenses"),
      fetch("/api/expense-categories"),
    ]);
    setExpenses(await expRes.json());
    setCategories(await catsRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function resetForm() {
    setCategoryId("");
    setAmount(0);
    setDate(new Date().toISOString().split("T")[0]);
    setNote("");
    setImage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !amount) {
      toast.error("Kategori dan jumlah wajib diisi");
      return;
    }
    setSubmitting(true);

    const formData = new FormData();
    formData.append("categoryId", categoryId);
    formData.append("amount", String(amount));
    formData.append("date", date);
    if (note) formData.append("note", note);
    if (image) formData.append("image", image);

    const endpoint = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
    const method = editingExpense ? "PUT" : "POST";
    const res = await fetch(endpoint, { method, body: formData });

    if (res.ok) {
      toast.success(editingExpense ? "Pengeluaran diperbarui" : "Pengeluaran berhasil dicatat");
      setDialogOpen(false);
      setEditingExpense(null);
      resetForm();
      fetchData();
    } else {
      toast.error(editingExpense ? "Gagal memperbarui pengeluaran" : "Gagal mencatat pengeluaran");
    }
    setSubmitting(false);
  }

  function openEditDialog(expense: Expense) {
    setEditingExpense(expense);
    setCategoryId(String(expense.categoryId));
    setAmount(expense.amount);
    setDate(expense.date);
    setNote(expense.note ?? "");
    setImage(null);
    setDialogOpen(true);
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Pengeluaran dihapus");
      setDeleteTarget(null);
      fetchData();
    } else {
      toast.error("Gagal menghapus data");
    }
  }

  function formatCurrency(val: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
  }

  const filteredExpenses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return expenses.filter((item) => {
      const matchSearch =
        keyword.length === 0 ||
        `${item.note ?? ""} ${item.categoryName ?? ""} ${item.amount} ${item.date}`.toLowerCase().includes(keyword);
      const { from, to } = selectedDateRange;
      const hasDateFilter = Boolean(from || to);
      if (!hasDateFilter) return matchSearch;

      const start = from && to ? (from <= to ? from : to) : (from ?? to);
      const end = from && to ? (from <= to ? to : from) : (from ?? to);
      const matchDate = start && end ? item.date >= start && item.date <= end : true;
      return matchSearch && matchDate;
    });
  }, [expenses, search, selectedDateRange]);

  const selectedRange = useMemo<DateRange | undefined>(() => {
    if (!selectedDateRange.from && !selectedDateRange.to) return undefined;
    return {
      from: selectedDateRange.from ? fromDateKey(selectedDateRange.from) : undefined,
      to: selectedDateRange.to ? fromDateKey(selectedDateRange.to) : undefined,
    };
  }, [selectedDateRange]);

  const dateFilterLabel = useMemo(() => {
    const { from, to } = selectedDateRange;
    if (!from && !to) return "Filter tanggal";
    if (from && to) return `${from} - ${to}`;
    return from ?? to ?? "Filter tanggal";
  }, [selectedDateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredExpenses.slice(start, start + PAGE_SIZE);
  }, [filteredExpenses, page]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedDateRange]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengeluaran</h1>
          <p className="text-muted-foreground">Kelola catatan pengeluaran Anda</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingExpense(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingExpense(null);
                resetForm();
              }}
            >
              <PlusIcon className="mr-1 size-4" /> Tambah Pengeluaran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Ubah Pengeluaran" : "Catat Pengeluaran"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <CategoryCombobox
                  categories={categories}
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="Pilih kategori pengeluaran..."
                />
              </div>
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <CurrencyInput
                  value={amount}
                  onChange={setAmount}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea
                  placeholder="Tulis catatan pengeluaran..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Gambar Bukti (opsional)</Label>
                <ImageUpload value={image} onChange={setImage} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
                {submitting ? "Menyimpan..." : editingExpense ? "Simpan Perubahan" : "Simpan Pengeluaran"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari pengeluaran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <CalendarIcon className="mr-2 size-4" />
                  {dateFilterLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto space-y-2 p-0">
                <Calendar
                  mode="range"
                  selected={selectedRange}
                  onSelect={(range) =>
                    setSelectedDateRange({
                      from: range?.from ? toDateKey(range.from) : undefined,
                      to: range?.to ? toDateKey(range.to) : undefined,
                    })
                  }
                />
                {(selectedDateRange.from || selectedDateRange.to) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedDateRange({})}
                  >
                    Hapus filter tanggal
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          </div>
          {paginatedExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada catatan pengeluaran</p>
          ) : (
            <div className="space-y-3">
              {paginatedExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {expense.imageUrl && (
                      <a href={expense.imageUrl} target="_blank" rel="noopener noreferrer">
                        <ImageIcon className="size-4 text-muted-foreground" />
                      </a>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{expense.note || expense.categoryName || "Pengeluaran"}</p>
                      <p className="text-xs text-muted-foreground">
                        {expense.categoryName} · {expense.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      -{formatCurrency(expense.amount)}
                    </span>
                    <Button size="icon" variant="ghost" className="size-8" onClick={() => openEditDialog(expense)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => setDeleteTarget(expense)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {filteredExpenses.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, filteredExpenses.length)} dari {filteredExpenses.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-sm">
                  Halaman {page} dari {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus catatan pengeluaran?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Entri <span className="font-medium text-foreground">{deleteTarget?.note || deleteTarget?.categoryName || "Pengeluaran"}</span> akan dihapus permanen.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
