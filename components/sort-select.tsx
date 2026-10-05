"use client";

import { useRouter } from "next/navigation";

const options = [
  ["newest", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["name", "Name: A–Z"],
] as const;

export function SortSelect({ category, value }: { category?: string; value: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Sort by
      <select
        value={value}
        onChange={(e) => {
          const q = new URLSearchParams();
          if (category) q.set("category", category);
          if (e.target.value !== "newest") q.set("sort", e.target.value);
          router.push(`/products${q.size ? `?${q}` : ""}`);
        }}
        className="rounded-full border border-line bg-white py-2 pl-4 pr-8 text-sm font-medium text-ink outline-none focus:border-ink"
      >
        {options.map(([k, l]) => (
          <option key={k} value={k}>{l}</option>
        ))}
      </select>
    </label>
  );
}
