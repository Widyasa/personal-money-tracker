"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TutorialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tutorial</h1>
        <p className="text-muted-foreground">Panduan singkat menggunakan Money Tracker</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cara pakai dalam 6 langkah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">1. Tambah kategori dulu.</span>{" "}
            Masuk ke menu <span className="font-medium text-foreground">Kategori</span>, lalu buat kategori pemasukan dan pengeluaran sesuai kebutuhan.
          </p>
          <p>
            <span className="font-medium text-foreground">2. Catat pemasukan.</span>{" "}
            Buka menu <span className="font-medium text-foreground">Pemasukan</span>, klik tombol tambah, isi kategori, jumlah, tanggal, dan catatan jika perlu.
          </p>
          <p>
            <span className="font-medium text-foreground">3. Catat pengeluaran.</span>{" "}
            Buka menu <span className="font-medium text-foreground">Pengeluaran</span>, isi data transaksi, dan tambahkan bukti gambar bila diperlukan.
          </p>
          <p>
            <span className="font-medium text-foreground">4. Cek ringkasan di Dashboard.</span>{" "}
            Di halaman <span className="font-medium text-foreground">Dashboard</span> Anda bisa melihat total pemasukan, pengeluaran, saldo, utang, dan grafik.
          </p>
          <p>
            <span className="font-medium text-foreground">5. Kelola utang dan tabungan.</span>{" "}
            Gunakan menu <span className="font-medium text-foreground">Utang</span> untuk catat pembayaran, dan menu <span className="font-medium text-foreground">Tabungan</span> untuk pantau saldo aset.
          </p>
          <p>
            <span className="font-medium text-foreground">6. Edit atau hapus data jika perlu.</span>{" "}
            Di daftar transaksi, gunakan ikon pensil untuk ubah data dan ikon hapus untuk menghapus melalui popup konfirmasi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
