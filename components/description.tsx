/** Plain text with "* " bullet lines → heading/paragraphs + bullet list. */
export function Description({ text }: { text: string }) {
  const blocks: { type: "p" | "ul"; lines: string[] }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.startsWith("* ") || line.startsWith("- ");
    const last = blocks.at(-1);
    if (bullet) {
      if (last?.type === "ul") last.lines.push(line.slice(2));
      else blocks.push({ type: "ul", lines: [line.slice(2)] });
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  }

  return (
    <div className="mt-6 max-w-xl space-y-3 leading-relaxed text-stone-600">
      {blocks.map((b, n) =>
        b.type === "ul" ? (
          <ul key={n} className="space-y-2">
            {b.lines.map((l) => (
              <li key={l} className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson" aria-hidden />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={n} className={n === 0 && blocks.length > 1 ? "text-sm font-semibold uppercase tracking-wider text-ink" : undefined}>
            {b.lines[0]}
          </p>
        ),
      )}
    </div>
  );
}
