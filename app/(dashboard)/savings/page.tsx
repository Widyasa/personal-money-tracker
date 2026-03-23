"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon, Pencil, PiggyBankIcon, PlusIcon, SearchIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

type SavingsAccount = {
  id: number;
  name: string;
  type: "CASH" | "BANK" | "ASSET";
  balance: number;
  createdAt: string;
};
const PAGE_SIZE = 9;

export default function SavingsPage() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SavingsAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CASH" | "BANK" | "ASSET">("ALL");
  const [page, setPage] = useState(1);

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("CASH");
  const [balance, setBalance] = useState("");

  async function fetchAccounts() {
    const res = await fetch("/api/savings");
    setAccounts(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchAccounts(); }, []);

  function resetForm() {
    setName("");
    setType("CASH");
    setBalance("");
    setEditingAccount(null);
  }

  function openEdit(account: SavingsAccount) {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type);
    setBalance(String(account.balance));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const body = { name, type, balance: Number(balance) };

    if (editingAccount) {
      const res = await fetch(`/api/savings/${editingAccount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Akun diperbarui");
        setDialogOpen(false);
        resetForm();
        fetchAccounts();
      } else {
        toast.error("Gagal memperbarui");
      }
    } else {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Akun berhasil dibuat");
        setDialogOpen(false);
        resetForm();
        fetchAccounts();
      } else {
        toast.error("Gagal membuat akun");
      }
    }
    setSubmitting(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus akun tabungan ini?")) return;
    const res = await fetch(`/api/savings/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Akun dihapus");
      fetchAccounts();
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

  const filteredAccounts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return accounts.filter((item) => {
      const matchSearch =
        keyword.length === 0 ||
        `${item.name} ${item.type} ${item.balance}`.toLowerCase().includes(keyword);
      const matchType = typeFilter === "ALL" || item.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [accounts, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const paginatedAccounts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAccounts.slice(start, start + PAGE_SIZE);
  }, [filteredAccounts, page]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const totalSavings = accounts.reduce((sum, a) => sum + a.balance, 0);

  const typeColorMap: Record<string, string> = {
    CASH: "bg-emerald-500",
    BANK: "bg-sky-500",
    ASSET: "bg-amber-500",
  };

  const badgeVariantMap: Record<string, "default" | "secondary" | "outline"> = {
    CASH: "default",
    BANK: "secondary",
    ASSET: "outline",
  };

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
          <h1 className="text-2xl font-bold tracking-tight">Tabungan</h1>
          <p className="text-muted-foreground">Kelola tabungan dan aset Anda</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1 size-4" /> Tambah Akun
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Ubah Akun" : "Tambah Akun Tabungan"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Akun</Label>
                <Input placeholder="contoh: BCA, Tunai, Emas" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Tunai</SelectItem>
                    <SelectItem value="BANK">Bank</SelectItem>
                    <SelectItem value="ASSET">Aset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Saldo</Label>
                <Input type="number" placeholder="0" value={balance} onChange={(e) => setBalance(e.target.value)} required step="any" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
                {submitting ? "Menyimpan..." : editingAccount ? "Simpan Perubahan" : "Buat Akun"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Tabungan</CardTitle>
          <PiggyBankIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(totalSavings)}</div>
          {accounts.length > 0 && (
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full">
              {accounts.map((account) => {
                const pct = totalSavings > 0 ? (account.balance / totalSavings) * 100 : 0;
                return (
                  <div
                    key={account.id}
                    className={`${typeColorMap[account.type] || "bg-primary"} first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${pct}%` }}
                    title={`${account.name}: ${formatCurrency(account.balance)}`}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari tabungan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Filter tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="CASH">Tunai</SelectItem>
                <SelectItem value="BANK">Bank</SelectItem>
                <SelectItem value="ASSET">Aset</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {paginatedAccounts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">Tidak ada akun tabungan yang cocok dengan filter saat ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedAccounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{account.name}</CardTitle>
                </div>
                <Badge variant={badgeVariantMap[account.type]}>{account.type}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
                <div className="flex gap-1 mt-3">
                  <Button size="sm" variant="outline" onClick={() => openEdit(account)}>
                    <Pencil className="mr-1 size-3.5" /> Ubah
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(account.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {filteredAccounts.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredAccounts.length)} dari {filteredAccounts.length}
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
