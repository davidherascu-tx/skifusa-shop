const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const TruckIcon = () => (
  <svg {...base}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></svg>
);
export const BadgeCheckIcon = () => (
  <svg {...base}><path d="M12 3l2.4 1.8 3-.2 1 2.8 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-1 2.8-3-.2L12 21l-2.4-1.8-3 .2-1-2.8L3.2 14.8l.9-2.9-.9-2.9 2.4-1.8 1-2.8 3 .2z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
);
export const BoxIcon = () => (
  <svg {...base}><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></svg>
);
export const HeadsetIcon = () => (
  <svg {...base}><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M19 20c0 1.5-2 2-5 2" /></svg>
);
export const ArrowIcon = () => (
  <svg {...base} width={18} height={18} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const LockIcon = () => (
  <svg {...base} width={14} height={14} strokeWidth={2}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
);
