"use client";

import Image from "next/image";
import { useState } from "react";

/** Main image with clickable thumbnails (front / back). */
export function ProductGallery({ images, alt, own }: { images: string[]; alt: string; own: boolean }) {
  const [i, setI] = useState(0);

  if (!images.length) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-mist">
        <span className="display text-9xl text-stone-300">空手</span>
      </div>
    );
  }

  return (
    <div>
      <div className={`relative aspect-square overflow-hidden rounded-3xl ${own ? "border border-line bg-white" : "bg-mist"}`}>
        <Image
          key={images[i]}
          src={images[i]}
          alt={`${alt}${images.length > 1 ? ` (view ${i + 1} of ${images.length})` : ""}`}
          fill
          sizes="(min-width:1024px) 50vw, 100vw"
          className={own ? "object-contain p-3" : "object-contain p-10"}
          priority={i === 0}
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((src, n) => (
            <button
              key={src}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show view ${n + 1}`}
              aria-current={n === i}
              className={`relative h-20 w-20 overflow-hidden rounded-xl border bg-white transition ${n === i ? "border-ink ring-2 ring-ink/20" : "border-line hover:border-stone-400"}`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
