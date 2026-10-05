export function PageShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <>
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
          <p className="eyebrow !text-white/60">{eyebrow}</p>
          <h1 className="display mt-3 text-5xl sm:text-7xl">{title}</h1>
        </div>
      </section>
      <div className="mx-auto max-w-3xl space-y-5 px-5 py-14 leading-relaxed text-stone-700">{children}</div>
    </>
  );
}

export const Todo = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-xl border border-dashed border-line bg-mist p-4 text-sm text-muted">TODO: {children}</p>
);
