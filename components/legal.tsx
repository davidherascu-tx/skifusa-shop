/** Small building blocks for the policy pages. */
export function Updated({ date }: { date: string }) {
  return <p className="text-sm text-muted">Last updated: {date}</p>;
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-4">
      <h2 className="display text-3xl text-ink">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson" aria-hidden />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
