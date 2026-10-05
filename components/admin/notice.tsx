export function Notice({ saved, error }: { saved?: string; error?: string }) {
  if (error) return <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>;
  if (saved) return <p role="status" className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">✓ {saved}</p>;
  return null;
}
