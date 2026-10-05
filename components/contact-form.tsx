"use client";

import { useActionState } from "react";
import { sendContact, type ContactState } from "@/app/contact/actions";
import { Turnstile } from "@/components/turnstile";
import { TOPICS } from "@/lib/contact";

const initial: ContactState = { status: "idle", attempt: 0 };

type Props = {
  formToken: string;
  turnstileSiteKey?: string;
  prefill: { name: string; email: string };
  orderNumbers: string[];
};

const Err = ({ id, msg }: { id: string; msg?: string }) =>
  msg ? <p id={id} role="alert" className="mt-1.5 text-sm text-red-700">{msg}</p> : null;

export function ContactForm({ formToken, turnstileSiteKey, prefill, orderNumbers }: Props) {
  const [state, action, pending] = useActionState(sendContact, initial);

  if (state.status === "ok") {
    return (
      <div role="status" className="rounded-3xl bg-emerald-50 p-8 text-emerald-900">
        <p className="display text-3xl">Message sent</p>
        <p className="mt-2">Thank you! We received your message and will reply by email as soon as possible.</p>
      </div>
    );
  }

  const v = state.values ?? { name: prefill.name, email: prefill.email, topic: "", order: "", message: "" };
  const e = state.errors ?? {};

  return (
    // key remounts the fields after each attempt so the typed values are kept and the spam check renews
    <form key={state.attempt} action={action} className="space-y-4" noValidate>
      <input type="hidden" name="ft" value={formToken} />

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{state.message}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium">Your name</label>
          <input id="c-name" name="name" required maxLength={100} defaultValue={v.name} autoComplete="name" aria-describedby="c-name-err" className="input" />
          <Err id="c-name-err" msg={e.name} />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium">Email</label>
          <input id="c-email" name="email" type="email" required maxLength={254} defaultValue={v.email} autoComplete="email" aria-describedby="c-email-err" className="input" />
          <Err id="c-email-err" msg={e.email} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-topic" className="mb-1.5 block text-sm font-medium">Topic</label>
          <select id="c-topic" name="topic" defaultValue={v.topic || TOPICS[0]} className="input">
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <Err id="c-topic-err" msg={e.topic} />
        </div>
        <div>
          <label htmlFor="c-order" className="mb-1.5 block text-sm font-medium">
            Order number <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="c-order" name="order" list="c-orders" maxLength={9} placeholder="#C03149FD" defaultValue={v.order} autoComplete="off" aria-describedby="c-order-err" className="input uppercase placeholder:normal-case" />
          <datalist id="c-orders">{orderNumbers.map((n) => <option key={n} value={`#${n}`} />)}</datalist>
          <Err id="c-order-err" msg={e.order} />
          <p className="mt-1.5 text-xs text-muted">You find it in your confirmation email and under My account.</p>
        </div>
      </div>

      <div>
        <label htmlFor="c-message" className="mb-1.5 block text-sm font-medium">Message</label>
        <textarea id="c-message" name="message" required rows={6} maxLength={2000} defaultValue={v.message} aria-describedby="c-message-err" className="input" />
        <Err id="c-message-err" msg={e.message} />
      </div>

      {turnstileSiteKey && <Turnstile siteKey={turnstileSiteKey} />}

      <button disabled={pending} className="btn btn-primary !px-10 !py-4">{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
