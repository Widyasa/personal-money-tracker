"use client";

import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function parseRupiah(str: string): number {
  const cleaned = str.replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "Rp 0",
  required,
  id,
}: CurrencyInputProps) {
  const [display, setDisplay] = useState(value ? `Rp ${formatRupiah(value)}` : "");

  useEffect(() => {
    if (value === 0 && display === "") return;
    setDisplay(value ? `Rp ${formatRupiah(value)}` : "");
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseRupiah(raw);
    setDisplay(num ? `Rp ${formatRupiah(num)}` : "");
    onChange(num);
  }, [onChange]);

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
    />
  );
}
