"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon, CreditCardIcon, Loader2Icon, PlusIcon, SearchIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/currency-input";

type Debt = {
  id: number;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  status: "UNPAID" | "PAID";
  notes: string | null;
  createdAt: string;
};
const PAGE_SIZE = 6;

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNPAID" | "PAID">("ALL");
  const [page, setPage] = useState(1);

  // Add form
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Pay form
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);

  async function fetchDebts() {
    const res = await fetch("/api/debts");
    setDebts(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchDebts(); }, []);

  async function handleAddDebt(e: React.FormEvent) {
    e.preventDefault();
    if (!totalAmount) { toast.error("Jumlah wajib diisi"); return; }
    setSubmitting(true);
    const res = await fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, totalAmount, notes: notes || null }),
    });
    if (res.ok) {
      toast.success("Utang berhasil dicatat");
      setAddOpen(false);
      setName("");
      setTotalAmount(0);
      setNotes("");
      fetchDebts();
    } else {
      toast.error("Gagal menambah utang");
    }
    setSubmitting(false);
  }

  async function handlePayDebt(e: React.FormEvent) {
    e.preventDefault();
    if (!payingDebt || !payAmount) return;
    setSubmitting(true);

    const res = await fetch("/api/debt-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        debtId: payingDebt.id,
        amount: payAmount,
        date: payDate,
      }),
    });

    if (res.ok) {
      toast.success("Pembayaran dicatat. Pengeluaran dibuat otomatis.");
      setPayOpen(false);
      setPayAmount(0);
      setPayDate(new Date().toISOString().split("T")[0]);
      fetchDebts();
    } else {
      const data = await res.json();
      toast.error(data.error || "Gagal mencatat pembayaran");
    }
    setSubmitting(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus utang ini beserta semua pembayarannya?")) return;
    const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Utang dihapus");
      fetchDebts();
    } else {
      toast.error("Gagal menghapus data");
    }
  }

  function formatCurrency(val: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
  }

  function formatDate(isoString: string) {
    return isoString.slice(0, 10);
  }

  const filteredDebts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return debts.filter((item) => {
      const matchSearch =
        keyword.length === 0 ||
        `${item.name} ${item.notes ?? ""} ${item.totalAmount} ${item.remainingAmount} ${item.status}`
          .toLowerCase()
          .includes(keyword);
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [debts, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDebts.length / PAGE_SIZE));
  const paginatedDebts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredDebts.slice(start, start + PAGE_SIZE);
  }, [filteredDebts, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

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
          <h1 className="text-2xl font-bold tracking-tight">Utang</h1>
          <p className="text-muted-foreground">Kelola utang dan catat pembayarannya</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1 size-4" /> Tambah Utang
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Utang Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddDebt} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Kreditor</Label>
                <Input placeholder="Berutang kepada siapa?" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Total Utang</Label>
                <CurrencyInput value={totalAmount} onChange={setTotalAmount} required />
              </div>
              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea placeholder="Detail tambahan" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
                {submitting ? "Menyimpan..." : "Simpan Utang"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pay Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran untuk {payingDebt?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePayDebt} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sisa: {payingDebt ? formatCurrency(payingDebt.remainingAmount) : ""}
            </p>
            <div className="space-y-2">
              <Label>Jumlah Bayar</Label>
              <CurrencyInput value={payAmount} onChange={setPayAmount} required />
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
            </div>
            <p className="text-xs text-muted-foreground">
              ⚡ Ini akan otomatis membuat entri pengeluaran
            </p>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
              {submitting ? "Memproses..." : "Catat Pembayaran"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari utang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="UNPAID">UNPAID</SelectItem>
                <SelectItem value="PAID">PAID</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {paginatedDebts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">Tidak ada utang yang cocok dengan filter saat ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {paginatedDebts.map((debt) => {
            const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
            return (
              <Card key={debt.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">{debt.name}</CardTitle>
                    {debt.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{debt.notes}</p>
                    )}
                  </div>
                  <Badge variant={debt.status === "PAID" ? "default" : "secondary"}>
                    {debt.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{formatCurrency(debt.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sisa</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {formatCurrency(debt.remainingAmount)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    {debt.status === "UNPAID" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setPayingDebt(debt);
                          setPayOpen(true);
                        }}
                      >
                        <CreditCardIcon className="mr-1 size-3.5" /> Bayar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(debt.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {filteredDebts.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredDebts.length)} dari {filteredDebts.length}
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
    </div>
  );
}
