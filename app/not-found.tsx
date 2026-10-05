import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-32 text-center">
      <p className="display text-9xl text-crimson">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <Link href="/products" className="btn btn-dark mt-8">Back to the shop</Link>
    </div>
  );
}
