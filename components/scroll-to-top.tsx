"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Every page change (and category change) starts at the very top of the page. */
export function ScrollToTop() {
  const pathname = usePathname();
  const category = useSearchParams().get("category");

  useEffect(() => {
    if (window.location.hash) return; // let #anchors (e.g. #member-access) work
    // Runs after Next.js has done its own scroll, which can leave the page's first lines under the sticky header.
    const id = window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }), 60);
    return () => window.clearTimeout(id);
  }, [pathname, category]);

  return null;
}
