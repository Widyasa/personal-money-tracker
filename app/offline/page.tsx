import { WifiOffIcon } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <WifiOffIcon className="size-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Anda sedang offline</h1>
      <p className="max-w-sm text-muted-foreground">
        Silakan cek koneksi internet Anda lalu coba lagi.
        Aplikasi membutuhkan koneksi aktif untuk berjalan.
      </p>
    </div>
  );
}
