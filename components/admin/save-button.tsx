"use client";

import { useFormStatus } from "react-dom";

export function SaveButton({ children = "Save", className = "btn btn-dark !px-5 !py-2" }: { children?: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Saving…" : children}
    </button>
  );
}
