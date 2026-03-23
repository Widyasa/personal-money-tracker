"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon, Pencil, PlusIcon, SearchIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Category = { id: number; name: string; createdAt: string };

const PAGE_SIZE = 10;

function CategoryTable({
  type,
  endpoint,
}: {
  type: string;
  endpoint: string;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  async function fetchCategories() {
    const res = await fetch(endpoint);
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  // Filter + paginate
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return categories.filter((c) => {
      return keyword.length === 0 || c.name.toLowerCase().includes(keyword);
    });
  }, [categories, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { setPage((prev) => Math.min(prev, totalPages)); }, [totalPages]);

  function openCreateDialog() {
    setEditingCategory(null);
    setNewName("");
    setDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category);
    setNewName(category.name);
    setDialogOpen(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const isEditing = Boolean(editingCategory);
    const targetEndpoint = isEditing ? `${endpoint}/${editingCategory?.id}` : endpoint;
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(targetEndpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    if (res.ok) {
      toast.success(isEditing ? "Kategori diperbarui" : `Kategori ${type} berhasil dibuat`);
      setDialogOpen(false);
      setEditingCategory(null);
      setNewName("");
      fetchCategories();
    } else {
      toast.error(isEditing ? "Gagal memperbarui" : "Gagal membuat kategori");
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Kategori dihapus");
      setDeleteTarget(null);
      fetchCategories();
    } else {
      toast.error("Kategori sedang dipakai dan tidak bisa dihapus");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingCategory(null);
              setNewName("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreateDialog}>
              <PlusIcon className="mr-1 size-4" /> Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Ubah Kategori" : `Tambah Kategori ${type}`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${type}-name`}>Nama</Label>
                <Input
                  id={`${type}-name`}
                  placeholder={`Masukkan nama kategori ${type.toLowerCase()}`}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                {editingCategory ? "Simpan Perubahan" : "Buat Kategori"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  {search ? "Tidak ada kategori yang cocok dengan pencarian" : `Belum ada kategori ${type.toLowerCase()}`}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((cat, idx) => (
                <TableRow key={cat.id}>
                  <TableCell className="text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{cat.name}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => openEditDialog(cat)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteTarget(cat)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
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
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus kategori?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Kategori <span className="font-medium text-foreground">{deleteTarget?.name}</span> akan dihapus.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kategori</h1>
        <p className="text-muted-foreground">Kelola kategori pemasukan dan pengeluaran</p>
      </div>

      <Tabs defaultValue="income">
        <TabsList>
          <TabsTrigger value="income">Kategori Pemasukan</TabsTrigger>
          <TabsTrigger value="expense">Kategori Pengeluaran</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kategori Pemasukan</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryTable type="Pemasukan" endpoint="/api/income-categories" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kategori Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryTable type="Pengeluaran" endpoint="/api/expense-categories" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
