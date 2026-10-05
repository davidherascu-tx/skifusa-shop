"use client";

import { useEffect, useRef } from "react";

type Api = { render: (el: HTMLElement, o: { sitekey: string; theme?: string }) => string; remove: (id: string) => void };
declare global {
  interface Window {
    turnstile?: Api;
    __turnstileReady?: () => void;
  }
}

/** Cloudflare Turnstile (a free, privacy-friendly CAPTCHA). Adds the hidden "cf-turnstile-response" field to the form. */
export function Turnstile({ siteKey }: { siteKey: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widget: string | undefined;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !box.current || !window.turnstile) return;
      widget = window.turnstile.render(box.current, { sitekey: siteKey, theme: "light" });
    };
    if (window.turnstile) mount();
    else {
      window.__turnstileReady = mount;
      if (!document.querySelector("script[data-turnstile]")) {
        const s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__turnstileReady";
        s.async = true;
        s.dataset.turnstile = "1";
        document.head.appendChild(s);
      }
    }
    return () => {
      cancelled = true;
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
  }, [siteKey]);

  return <div ref={box} className="min-h-[65px]" />;
}
